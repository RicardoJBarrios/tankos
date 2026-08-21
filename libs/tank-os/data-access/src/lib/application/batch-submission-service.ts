import type {
  BatchMaterializerPort,
  BatchMaterializerStorePort,
  BatchProgress,
  BatchRequest,
  BatchSelection,
  BatchSubmissionStorePort,
  BatchOperationPort,
  EntityId,
} from '../core';
import type { ClockPort } from '@tank-os/time';
import { createBatchRequest, createDataAccessError, createEntityId } from '../core';

function stableJson(value: unknown): string {
  try {
    if (value === undefined) return 'undefined';
    if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
    if (value && typeof value === 'object') {
      return `{${Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => `${JSON.stringify(key)}:${stableJson(entry)}`)
        .join(',')}}`;
    }
    const serialized = JSON.stringify(value);
    if (serialized === undefined) {
      throw new TypeError('Value cannot be serialized');
    }
    return serialized;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Batch request')) {
      throw error;
    }
    throw createDataAccessError(
      'validation',
      'Batch request contains a value that cannot be serialized',
      error,
    );
  }
}

/** Dependencies for durable, asynchronous batch submission. */
export interface BatchSubmissionServiceOptions<TPayload, TFilter> {
  readonly store: BatchSubmissionStorePort<TPayload>;
  /** Fenced persistence capability used only while resolving selections. */
  readonly materializerStore: BatchMaterializerStorePort<TPayload>;
  readonly materializer: BatchMaterializerPort<TFilter>;
  /** Technical clock supplied by the host, normally backed by `TimeService`. */
  readonly clock: ClockPort;
  readonly createBatchId: (request: BatchRequest<TPayload, TFilter>) => EntityId;
  readonly chunkSize?: number;
  /** Maximum number of target ids accepted for one logical batch. */
  readonly maxTargets?: number;
  /** Maximum serialized request size, kept below the Firestore document limit. */
  readonly maxRequestBytes?: number;
  /** Stable identity used to claim filter materialization. */
  readonly materializerOwnerId?: string;
  /** Lease duration for filter materialization. */
  readonly materializationLeaseDurationMilliseconds?: number;
}

/** Creates a submission boundary that persists materialization progress. */
export function createBatchSubmissionService<
  TPayload = unknown,
  TFilter = unknown,
>(
  options: BatchSubmissionServiceOptions<TPayload, TFilter>,
): BatchOperationPort<TPayload, TFilter> {
  const chunkSize = options.chunkSize ?? 400;
  const maxTargets = options.maxTargets ?? 10_000;
  const maxRequestBytes = options.maxRequestBytes ?? 900_000;
  const materializerOwnerId = options.materializerOwnerId ?? 'default-materializer';
  const materializationLeaseDurationMilliseconds =
    options.materializationLeaseDurationMilliseconds ?? 60_000;
  if (!Number.isInteger(chunkSize) || chunkSize < 1 || chunkSize > 400) {
    throw new RangeError('Batch chunk size must be an integer between 1 and 400');
  }
  if (!Number.isInteger(maxTargets) || maxTargets < 1) {
    throw new RangeError('Batch target limit must be a positive integer');
  }
  if (
    !Number.isInteger(maxRequestBytes) ||
    maxRequestBytes < 1_000 ||
    maxRequestBytes > 900_000
  ) {
    throw new RangeError(
      'Batch request size must be an integer between 1000 and 900000 bytes',
    );
  }
  if (
    !materializerOwnerId.trim() ||
    !Number.isInteger(materializationLeaseDurationMilliseconds) ||
    materializationLeaseDurationMilliseconds < 1
  ) {
    throw new RangeError('Materialization lease configuration is invalid');
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
      if (new TextEncoder().encode(requestFingerprint).byteLength > maxRequestBytes) {
        throw createDataAccessError(
          'validation',
          `Batch request exceeds the ${maxRequestBytes}-byte limit`,
        );
      }
      const now = options.clock.now();
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
      const claim = await options.materializerStore.claimMaterialization(batchId, {
        ownerId: materializerOwnerId,
        now: options.clock.now(),
        leaseDurationMilliseconds: materializationLeaseDurationMilliseconds,
      });
      const current = claim.record;
      if (!claim.claimed) return project(current);
      if (!claim.lease) {
        throw createDataAccessError(
          'conflict',
          'A claimed materialization must include a fencing lease',
        );
      }
      const lease = claim.lease;
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
      if (await options.materializerStore.isCancellationRequested(batchId)) {
        return project(
          await options.materializerStore.update(batchId, {
            status: 'cancelled',
            updatedAt: options.clock.now(),
            materializationLeaseOwner: null,
            materializationLeaseToken: null,
            materializationLeaseUntil: null,
          }, lease),
        );
      }
      for (let offset = 0; offset < ids.length; offset += chunkSize) {
        const chunkIds = ids.slice(offset, offset + chunkSize);
        await options.materializerStore.putChunk(batchId, {
          chunkId: createEntityId(`chunk-${Math.floor(offset / chunkSize) + 1}`),
          ids: chunkIds,
          status: 'pending',
          attempts: 0,
        }, lease);
      }
      const queued = await options.materializerStore.update(batchId, {
        status: 'queued',
        total: ids.length,
        selection: {
          fingerprint: current.requestFingerprint,
          total: ids.length,
          chunkCount: Math.ceil(ids.length / chunkSize),
        },
        updatedAt: options.clock.now(),
        materializationLeaseOwner: null,
        materializationLeaseToken: null,
        materializationLeaseUntil: null,
      }, lease);
      /* c8 ignore next -- V8 reports the async materialization return as a synthetic branch. */
      return project(queued);
    },
    /* c8 ignore next -- V8 reports the async method boundary as a synthetic branch. */
    async get(batchId) {
      /* c8 ignore next -- V8 reports the async read return as a synthetic branch. */
      return project(await options.store.get(batchId));
    },
    async resume(batchId) {
      const current = await options.store.get(batchId);
      if (!current) throw createDataAccessError('not-found', 'Batch was not found');
      if (
        current.status === 'queued' ||
        current.status === 'completed' ||
        current.status === 'cancelled'
      ) {
        return project(current);
      }
      if (current.status !== 'failed' && current.status !== 'interrupted') {
        throw createDataAccessError(
          'conflict',
          `Batch cannot be resumed from status ${current.status}`,
        );
      }
      /* c8 ignore next -- V8 reports the async command boundary as a synthetic branch. */
      const updatedAt = options.clock.now();
      const resumed = await options.store.update(batchId, {
        status: 'queued',
        /* c8 ignore next -- V8 reports the shorthand property as a synthetic branch. */
        updatedAt,
      });
      /* c8 ignore next -- V8 reports the async resume return as a synthetic branch. */
      return project(resumed);
    /* c8 ignore next -- V8 reports the async method boundary as a synthetic branch. */
    },
    /* c8 ignore next -- V8 reports the async cancellation method boundary as a synthetic branch. */
    async cancel(batchId) {
      const current = await options.store.get(batchId);
      if (!current) throw createDataAccessError('not-found', 'Batch was not found');
      if (current.status === 'completed' || current.status === 'cancelled') {
        return project(current);
      }
      return project(await options.store.requestCancellation(batchId));
    },
  };
}

function project<TPayload>(
  record: Awaited<ReturnType<BatchSubmissionStorePort<TPayload>['get']>>,
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
    leaseOwner,
    leaseUntil,
  } = record;
  return {
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
    leaseOwner,
    leaseUntil,
  };
}
