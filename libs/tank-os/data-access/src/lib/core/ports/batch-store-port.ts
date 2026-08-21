import type {
  BatchChunk,
  BatchItemResult,
  BatchOperationRecord,
  EntityId,
  TechnicalTimestamp,
} from '../value-types';

/** Fields that a worker may change on a durable batch summary. */
export interface BatchSummaryPatch {
  readonly status?: BatchOperationRecord['status'];
  readonly total?: number;
  readonly processed?: number;
  readonly warnings?: number;
  readonly failures?: number;
  readonly retryCount?: number;
  readonly currentChunk?: EntityId;
  readonly selection?: BatchOperationRecord['selection'];
  readonly updatedAt: TechnicalTimestamp;
  readonly leaseOwner?: string | null;
  readonly leaseUntil?: TechnicalTimestamp | null;
}

/** Result of an atomic worker claim attempt. */
export interface BatchClaim<TPayload = unknown> {
  readonly claimed: boolean;
  readonly record: BatchOperationRecord<TPayload>;
}

/** Atomic worker ownership request with an expiry for crash recovery. */
export interface BatchClaimRequest {
  readonly workerId: string;
  readonly now: TechnicalTimestamp;
  readonly leaseDurationMilliseconds: number;
}

/** Durable persistence boundary for one logical asynchronous batch. */
export interface BatchStorePort<TPayload = unknown> {
  /** Creates one operation and its idempotency reservation atomically. */
  create(
    record: BatchOperationRecord<TPayload>,
    idempotencyKey: string,
  ): Promise<BatchOperationRecord<TPayload>>;
  /** Loads the operation summary without loading all item results. */
  get(batchId: EntityId): Promise<BatchOperationRecord<TPayload> | undefined>;
  /** Claims a non-terminal operation so only one worker executes it. */
  claim(batchId: EntityId, request: BatchClaimRequest): Promise<BatchClaim<TPayload>>;
  /** Updates only the bounded summary fields of an operation. */
  update(
    batchId: EntityId,
    patch: BatchSummaryPatch,
  ): Promise<BatchOperationRecord<TPayload>>;
  /** Persists one bounded physical chunk in its own document. */
  putChunk(batchId: EntityId, chunk: BatchChunk): Promise<void>;
  /** Lists at most `limit` chunks eligible for execution or retry. */
  listRunnableChunks(
    batchId: EntityId,
    limit?: number,
  ): Promise<readonly BatchChunk[]>;
  /** Persists one item result in a separate document. */
  putResult(
    batchId: EntityId,
    chunkId: EntityId,
    result: BatchItemResult,
  ): Promise<void>;
  /** Requests cooperative cancellation without deleting operation state. */
  requestCancellation(
    batchId: EntityId,
  ): Promise<BatchOperationRecord<TPayload>>;
  /** Reads the cancellation flag used between chunks and items. */
  isCancellationRequested(batchId: EntityId): Promise<boolean>;
  /** Removes terminal state and its detail documents, preserving idempotency history. */
  remove(batchId: EntityId): Promise<void>;
}
