import type { ClockPort } from '@tankos/time';
import type {
  BatchMaterializerPort,
  BatchMaterializerStorePort,
  BatchOperationPort,
  BatchProgress,
  BatchRequest,
  BatchSubmissionStorePort,
  EntityId,
} from '../core';
import { createDataAccessError, createEntityId } from '../core';
import { BatchSubmissionServiceImplementation } from './batch-submission-service-implementation';

/** Dependencies for durable, asynchronous batch submission. */
export interface BatchSubmissionServiceOptions<TPayload, TFilter> {
  readonly store: BatchSubmissionStorePort<TPayload>;
  /** Fenced persistence capability used only while resolving selections. */
  readonly materializerStore: BatchMaterializerStorePort<TPayload>;
  readonly materializer: BatchMaterializerPort<TFilter>;
  /** Technical clock supplied by the host, normally backed by `TimeService`. */
  readonly clock: ClockPort;
  readonly createBatchId: (
    request: BatchRequest<TPayload, TFilter>,
  ) => EntityId;
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
  return new BatchSubmissionServiceImplementation(options);
}

/** Internal normalized configuration. */
export interface BatchSubmissionConfiguration {
  readonly chunkSize: number;
  readonly maxTargets: number;
  readonly maxRequestBytes: number;
  readonly materializerOwnerId: string;
  readonly materializationLeaseDurationMilliseconds: number;
}

/** Normalizes and validates submission limits. */
export function resolveSubmissionConfiguration<TPayload, TFilter>(
  options: BatchSubmissionServiceOptions<TPayload, TFilter>,
): BatchSubmissionConfiguration {
  const configuration = {
    chunkSize: options.chunkSize ?? 400,
    maxTargets: options.maxTargets ?? 10_000,
    maxRequestBytes: options.maxRequestBytes ?? 900_000,
    materializerOwnerId: options.materializerOwnerId ?? 'default-materializer',
    materializationLeaseDurationMilliseconds:
      options.materializationLeaseDurationMilliseconds ?? 60_000,
  };
  assertIntegerRange(
    configuration.chunkSize,
    1,
    400,
    'Batch chunk size must be an integer between 1 and 400',
  );
  assertIntegerRange(
    configuration.maxTargets,
    1,
    Number.MAX_SAFE_INTEGER,
    'Batch target limit must be a positive integer',
  );
  assertIntegerRange(
    configuration.maxRequestBytes,
    1_000,
    900_000,
    'Batch request size must be an integer between 1000 and 900000 bytes',
  );
  if (!configuration.materializerOwnerId.trim())
    throw new RangeError('Materialization lease configuration is invalid');
  assertIntegerRange(
    configuration.materializationLeaseDurationMilliseconds,
    1,
    Number.MAX_SAFE_INTEGER,
    'Materialization lease configuration is invalid',
  );
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

/** Stable serialization for idempotency and request-size checks. */
export function stableJson(value: unknown): string {
  try {
    if (value === undefined) return 'undefined';
    if (Array.isArray(value)) return `[${value.map(stableJson).join(',')}]`;
    if (value && typeof value === 'object')
      return `{${Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => `${JSON.stringify(key)}:${stableJson(entry)}`)
        .join(',')}}`;
    const serialized = JSON.stringify(value);
    if (serialized === undefined)
      throw new TypeError('Value cannot be serialized');
    return serialized;
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('Batch request'))
      throw error;
    throw createDataAccessError(
      'validation',
      'Batch request contains a value that cannot be serialized',
      error,
    );
  }
}

/** Patch used after a selection has been materialized. */
export function createQueuedPatch(
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

/** Patch used to resume an interrupted batch. */
export function createResumePatch(updatedAt: ReturnType<ClockPort['now']>) {
  return { status: 'queued' as const, updatedAt };
}

/** Patch used to persist cancellation during materialization. */
export function createMaterializationCancelledPatch(
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

/** Creates one pending chunk from a materialized id list. */
export function createPendingChunk(
  chunkId: EntityId,
  ids: readonly EntityId[],
) {
  return { chunkId, ids, status: 'pending' as const, attempts: 0 };
}

/** Splits materialized ids into durable chunks. */
export function createPendingChunks(
  ids: readonly EntityId[],
  chunkSize: number,
) {
  return Array.from({ length: Math.ceil(ids.length / chunkSize) }, (_, index) =>
    createPendingChunk(
      createEntityId(`chunk-${index + 1}`),
      ids.slice(index * chunkSize, index * chunkSize + chunkSize),
    ),
  );
}

/** Projects a persisted record to the public progress contract. */
export function project<TPayload>(
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
