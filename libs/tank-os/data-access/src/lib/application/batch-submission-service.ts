import type {
  BatchMaterializerPort,
  BatchProgress,
  BatchRequest,
  BatchSelection,
  BatchStorePort,
  BatchSubmissionPort,
  EntityId,
  TechnicalTimestamp,
} from '../core';
import { createBatchRequest, createDataAccessError, createEntityId } from '../core';

function stableJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => `${JSON.stringify(key)}:${stableJson(entry)}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

/** Dependencies for durable, asynchronous batch submission. */
export interface BatchSubmissionServiceOptions<TPayload, TFilter> {
  readonly store: BatchStorePort<TPayload>;
  readonly materializer: BatchMaterializerPort<TFilter>;
  readonly now: () => TechnicalTimestamp;
  readonly createBatchId: (request: BatchRequest<TPayload, TFilter>) => EntityId;
  readonly chunkSize?: number;
  /** Maximum number of target ids accepted for one logical batch. */
  readonly maxTargets?: number;
}

/** Creates a submission boundary that persists materialization progress. */
export function createBatchSubmissionService<
  TPayload = unknown,
  TFilter = unknown,
>(
  options: BatchSubmissionServiceOptions<TPayload, TFilter>,
): BatchSubmissionPort<TPayload, TFilter> {
  const chunkSize = options.chunkSize ?? 400;
  const maxTargets = options.maxTargets ?? 10_000;
  if (!Number.isInteger(chunkSize) || chunkSize < 1 || chunkSize > 400) {
    throw new RangeError('Batch chunk size must be an integer between 1 and 400');
  }
  if (!Number.isInteger(maxTargets) || maxTargets < 1) {
    throw new RangeError('Batch target limit must be a positive integer');
  }

  return {
    async submit(input) {
      const request = createBatchRequest(input);
      const requestFingerprint = stableJson({
        schema: request.schema,
        operation: request.operation,
        selection: request.selection,
        payload: request.payload,
      });
      const now = options.now();
      const record = {
        batchId: options.createBatchId(request),
        principalId: request.access.principalId,
        schema: request.schema,
        operation: request.operation,
        status: 'materializing' as const,
        total: 0,
        processed: 0,
        warnings: 0,
        failures: 0,
        retryCount: 0,
        createdAt: now,
        updatedAt: now,
        selection: { fingerprint: requestFingerprint, total: 0, chunkCount: 0 },
        requestedSelection: request.selection,
        payload: request.payload,
        requestFingerprint,
      };
      return project(await options.store.create(record, request.idempotencyKey));
    },
    async materialize(batchId) {
      const current = await options.store.get(batchId);
      if (!current) throw createDataAccessError('not-found', 'Batch was not found');
      if (current.status !== 'materializing' || !current.requestedSelection) {
        return project(current);
      }
      const requestedSelection = current.requestedSelection as BatchSelection<TFilter>;
      const ids = [
        ...(await options.materializer.materialize(requestedSelection, {
          maxTargets,
        })),
      ];
      if (ids.length > maxTargets) {
        throw createDataAccessError(
          'validation',
          `Batch selection exceeds the ${maxTargets} target limit`,
        );
      }
      if (new Set(ids).size !== ids.length) {
        throw createDataAccessError(
          'validation',
          'Batch materializer returned duplicate target ids',
        );
      }
      for (let offset = 0; offset < ids.length; offset += chunkSize) {
        const chunkIds = ids.slice(offset, offset + chunkSize);
        await options.store.putChunk(batchId, {
          chunkId: createEntityId(`chunk-${Math.floor(offset / chunkSize) + 1}`),
          ids: chunkIds,
          status: 'pending',
          attempts: 0,
        });
      }
      return project(
        await options.store.update(batchId, {
          status: 'queued',
          total: ids.length,
          selection: {
            fingerprint: current.requestFingerprint,
            total: ids.length,
            chunkCount: Math.ceil(ids.length / chunkSize),
          },
          updatedAt: options.now(),
        }),
      );
    },
    async get(batchId) {
      return project(await options.store.get(batchId));
    },
    async resume(batchId) {
      const current = await options.store.get(batchId);
      if (!current) throw createDataAccessError('not-found', 'Batch was not found');
      if (current.status === 'completed' || current.status === 'cancelled') {
        return project(current);
      }
      return project(
        await options.store.update(batchId, {
          status: 'queued',
          updatedAt: options.now(),
        }),
      );
    },
    async cancel(batchId) {
      const current = await options.store.get(batchId);
      if (!current) throw createDataAccessError('not-found', 'Batch was not found');
      if (current.status === 'completed' || current.status === 'cancelled') {
        return project(current);
      }
      return project(
        await options.store.update(batchId, {
          status: 'cancelled',
          updatedAt: options.now(),
        }),
      );
    },
  };
  /* c8 ignore next -- V8 reports the typed factory boundary as a synthetic branch. */
}

function project<TPayload>(
  record: Awaited<ReturnType<BatchStorePort<TPayload>['get']>>,
): BatchProgress {
  if (!record) throw createDataAccessError('not-found', 'Batch was not found');
  const {
    batchId,
    schema,
    operation,
    status,
    total,
    processed,
    warnings,
    failures,
    createdAt,
    updatedAt,
    currentChunk,
    retryCount,
  } = record;
  return { batchId, schema, operation, status, total, processed, warnings, failures, createdAt, updatedAt, currentChunk, retryCount };
}
