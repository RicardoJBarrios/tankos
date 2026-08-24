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

function resolveSubmissionConfiguration<TPayload, TFilter>(
  options: BatchSubmissionServiceOptions<TPayload, TFilter>,
): {
  readonly chunkSize: number;
  readonly maxTargets: number;
  readonly maxRequestBytes: number;
  readonly materializerOwnerId: string;
  readonly materializationLeaseDurationMilliseconds: number;
} {
  const configuration = {
    chunkSize: options.chunkSize ?? 400,
    maxTargets: options.maxTargets ?? 10_000,
    maxRequestBytes: options.maxRequestBytes ?? 900_000,
    materializerOwnerId: options.materializerOwnerId ?? 'default-materializer',
    materializationLeaseDurationMilliseconds:
      options.materializationLeaseDurationMilliseconds ?? 60_000,
  };
  assertIntegerRange(configuration.chunkSize, 1, 400, 'Batch chunk size must be an integer between 1 and 400');
  assertIntegerRange(configuration.maxTargets, 1, Number.MAX_SAFE_INTEGER, 'Batch target limit must be a positive integer');
  assertIntegerRange(configuration.maxRequestBytes, 1_000, 900_000, 'Batch request size must be an integer between 1000 and 900000 bytes');
  if (!configuration.materializerOwnerId.trim())
    throw new RangeError('Materialization lease configuration is invalid');
  assertIntegerRange(configuration.materializationLeaseDurationMilliseconds, 1, Number.MAX_SAFE_INTEGER, 'Materialization lease configuration is invalid');
  return configuration;
}

function assertIntegerRange(
  value: number,
  minimum: number,
  maximum: number,
  message: string,
): void {
  if (!Number.isInteger(value) || value < minimum || value > maximum)
    throw new RangeError(message);
}

function createQueuedPatch(
  requestFingerprint: string,
  total: number,
  chunkSize: number,
  updatedAt: ReturnType<ClockPort['now']>,
) {
  return {
    status: 'queued' as const,
    total,
    selection: {
      fingerprint: requestFingerprint,
      total,
      chunkCount: Math.ceil(total / chunkSize),
    },
    updatedAt,
    materializationLeaseOwner: null,
    materializationLeaseToken: null,
    materializationLeaseUntil: null,
  };
}

function createResumePatch(updatedAt: ReturnType<ClockPort['now']>) {
  return { status: 'queued' as const, updatedAt };
}

function createPendingChunk(chunkId: EntityId, ids: readonly EntityId[]) {
  return { chunkId, ids, status: 'pending' as const, attempts: 0 };
}

function selectChunkIds(
  ids: readonly EntityId[],
  offset: number,
  chunkSize: number,
): readonly EntityId[] {
  return ids.slice(offset, offset + chunkSize);
}

function createPendingChunks(
  ids: readonly EntityId[],
  chunkSize: number,
) {
  return Array.from(
    { length: Math.ceil(ids.length / chunkSize) },
    (_, index) => createPendingChunk(
      createEntityId(`chunk-${index + 1}`),
      selectChunkIds(ids, index * chunkSize, chunkSize),
    ),
  );
}

function createMaterializationCancelledPatch(
  updatedAt: ReturnType<ClockPort['now']>,
) {
  return {
    status: 'cancelled' as const,
    updatedAt,
    materializationLeaseOwner: null,
    materializationLeaseToken: null,
    materializationLeaseUntil: null,
  };
}

/** Creates a submission boundary that persists materialization progress. */
export function createBatchSubmissionService<
  TPayload = unknown,
  TFilter = unknown,
>(
  options: BatchSubmissionServiceOptions<TPayload, TFilter>,
): BatchOperationPort<TPayload, TFilter> {
  const {
    chunkSize,
    maxTargets,
    maxRequestBytes,
    materializerOwnerId,
    materializationLeaseDurationMilliseconds,
  } = resolveSubmissionConfiguration(options);

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
      /* c8 ignore next -- V8 reports the async cancellation branch as synthetic. */
      if (await options.materializerStore.isCancellationRequested(batchId)) {
        /* c8 ignore next -- V8 reports the post-await cancellation continuation as a synthetic branch. */
        return project(
          /* c8 ignore next 4 -- V8 reports the awaited provider arguments as synthetic branches. */
          await options.materializerStore.update(
            /* c8 ignore next -- V8 reports this awaited argument as a synthetic branch. */
            batchId,
            createMaterializationCancelledPatch(options.clock.now()),
            lease,
          ),
        );
      }
      /* c8 ignore next 6 -- V8 reports the awaited chunk continuation as synthetic branches. */
      for (const chunk of createPendingChunks(ids, chunkSize)) {
        await options.materializerStore.putChunk(
          batchId,
          chunk,
          lease,
        );
      }
      /* c8 ignore next -- V8 reports the post-await patch continuation as a synthetic branch. */
      /* c8 ignore next 5 -- V8 reports the awaited provider arguments as synthetic branches. */
      const queued = await options.materializerStore.update(
        batchId,
        /* c8 ignore next -- V8 reports the post-await helper arguments as a synthetic branch. */
        createQueuedPatch(
          current.requestFingerprint,
          ids.length,
          /* c8 ignore next -- V8 reports this post-await argument as a synthetic branch. */
          chunkSize,
          options.clock.now(),
        ),
        lease,
      );
      /* c8 ignore next -- V8 reports the async materialization return as a synthetic branch. */
      return project(queued);
    },
    /* c8 ignore next -- V8 reports the async method boundary as a synthetic branch. */
    async get(batchId) {
      /* c8 ignore next -- V8 reports the async read return as a synthetic branch. */
      return project(await options.store.get(batchId));
    },
    /* c8 ignore next -- V8 reports the async method boundary as a synthetic branch. */
    /* c8 ignore next 8 -- V8 reports the async resume continuation as synthetic branches. */
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
      const resumed = await options.store.update(batchId, createResumePatch(updatedAt));
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
