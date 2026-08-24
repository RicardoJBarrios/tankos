import type {
  BatchChunk,
  BatchItemResult,
  BatchOperationRecord,
  EntityId,
  TechnicalTimestamp,
} from '../value-types';

/** Fields that submission control may change on a durable batch summary. */
export interface BatchSubmissionPatch {
  readonly status?: BatchOperationRecord['status'];
  readonly updatedAt: TechnicalTimestamp;
}

/** Fields that selection materialization may change on a durable batch summary. */
export interface BatchMaterializerPatch {
  readonly status?: BatchOperationRecord['status'];
  readonly total?: number;
  readonly selection?: BatchOperationRecord['selection'];
  readonly updatedAt: TechnicalTimestamp;
  readonly materializationLeaseOwner?: string | null;
  readonly materializationLeaseToken?: string | null;
  readonly materializationLeaseUntil?: TechnicalTimestamp | null;
}

/** Fields that execution workers may change on a durable batch summary. */
export interface BatchWorkerPatch {
  readonly status?: BatchOperationRecord['status'];
  readonly processed?: number;
  readonly warnings?: number;
  readonly failures?: number;
  readonly retryCount?: number;
  readonly currentChunk?: EntityId;
  readonly updatedAt: TechnicalTimestamp;
  readonly leaseOwner?: string | null;
  readonly leaseUntil?: TechnicalTimestamp | null;
}

/** Result of an atomic worker claim attempt. */
export interface BatchLease {
  /** Stable worker identity that currently owns the lease. */
  readonly owner: string;
  /** Fencing token unique to this lease acquisition. */
  readonly token: string;
}

/** Result of an atomic worker or materializer claim attempt. */
export interface BatchClaim<TPayload = unknown> {
  readonly claimed: boolean;
  readonly record: BatchOperationRecord<TPayload>;
  /** Present only when this claim acquired the capability lease. */
  readonly lease?: BatchLease;
}

/** Atomic worker or materializer ownership request with expiry for crash recovery. */
export interface BatchClaimRequest {
  /** Stable host identity for the capability making the claim. */
  readonly ownerId: string;
  readonly now: TechnicalTimestamp;
  readonly leaseDurationMilliseconds: number;
}

/** Durable persistence boundary for one logical asynchronous batch. */
export interface BatchSubmissionStorePort<TPayload = unknown> {
  /** Creates one operation and its idempotency reservation atomically. */
  create(
    record: BatchOperationRecord<TPayload>,
    idempotencyKey: string,
  ): Promise<BatchOperationRecord<TPayload>>;
  /** Loads the operation summary without loading all item results. */
  get(batchId: EntityId): Promise<BatchOperationRecord<TPayload> | undefined>;
  /** Updates only the bounded summary fields of an operation. */
  update(
    batchId: EntityId,
    patch: BatchSubmissionPatch,
  ): Promise<BatchOperationRecord<TPayload>>;
  /** Requests cooperative cancellation without deleting operation state. */
  requestCancellation(
    batchId: EntityId,
  ): Promise<BatchOperationRecord<TPayload>>;
  /** Reads the cancellation flag used between chunks and items. */
  isCancellationRequested(batchId: EntityId): Promise<boolean>;
  /** Removes terminal state and its detail documents, preserving idempotency history. */
  remove(batchId: EntityId): Promise<void>;
}

/**
 * Fenced capability for resolving a batch selection into physical chunks.
 *
 * Materializer writes must carry the lease returned by
 * `claimMaterialization`; an expired materializer cannot publish chunks or
 * transition the batch.
 */
export interface BatchMaterializerStorePort<TPayload = unknown> {
  /** Reads the immutable selection and current materialization state. */
  get(batchId: EntityId): Promise<BatchOperationRecord<TPayload> | undefined>;
  /** Claims filter materialization so only one host resolves it at a time. */
  claimMaterialization(
    batchId: EntityId,
    request: BatchClaimRequest,
  ): Promise<BatchClaim<TPayload>>;
  /** Updates materialization state only with the current materializer lease. */
  update(
    batchId: EntityId,
    patch: BatchMaterializerPatch,
    lease: BatchLease,
  ): Promise<BatchOperationRecord<TPayload>>;
  /** Persists one bounded physical chunk with materializer fencing. */
  putChunk(
    batchId: EntityId,
    chunk: BatchChunk,
    lease: BatchLease,
  ): Promise<void>;
  /** Reads cooperative cancellation between materialization phases. */
  isCancellationRequested(batchId: EntityId): Promise<boolean>;
}

/**
 * Worker capability for durable batches.
 *
 * Worker-owned writes require the fencing lease by type. This prevents a
 * reclaimed worker from accidentally using the unguarded control API.
 */
export interface BatchWorkerStorePort<TPayload = unknown> {
  /** Loads the operation summary without loading all item results. */
  get(batchId: EntityId): Promise<BatchOperationRecord<TPayload> | undefined>;
  /** Lists at most `limit` chunks eligible for execution or retry. */
  listRunnableChunks(
    batchId: EntityId,
    limit?: number,
  ): Promise<readonly BatchChunk[]>;
  /** Reads the cancellation flag used between chunks and items. */
  isCancellationRequested(batchId: EntityId): Promise<boolean>;
  /** Claims a non-terminal operation so only one worker executes it. */
  claim(
    batchId: EntityId,
    request: BatchClaimRequest,
  ): Promise<BatchClaim<TPayload>>;
  /** Updates a summary only when the supplied lease is still current. */
  update(
    batchId: EntityId,
    patch: BatchWorkerPatch,
    lease: BatchLease,
  ): Promise<BatchOperationRecord<TPayload>>;
  /** Writes a chunk only when the supplied lease is still current. */
  putChunk(
    batchId: EntityId,
    chunk: BatchChunk,
    lease: BatchLease,
  ): Promise<void>;
  /** Writes all item results for a chunk under one fenced transaction. */
  putResults(
    batchId: EntityId,
    chunkId: EntityId,
    results: readonly BatchItemResult[],
    lease: BatchLease,
  ): Promise<void>;
}
