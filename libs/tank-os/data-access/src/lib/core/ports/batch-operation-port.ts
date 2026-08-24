import type {
  AccessContext,
  BatchProgress,
  BatchRequest,
  EntityId,
} from '../value-types';

/** Port for submitting and observing asynchronous batch operations. */
export interface BatchOperationPort<TPayload = unknown, TFilter = unknown> {
  /** Persists a request without waiting for materialization or execution. */
  submit(request: BatchRequest<TPayload, TFilter>): Promise<BatchProgress>;
  /** Resolves the persisted selection into executable chunks. */
  materialize(batchId: EntityId): Promise<BatchProgress>;
  /** Reads the bounded progress projection. */
  get(batchId: EntityId): Promise<BatchProgress | undefined>;
  /** Requeues a resumable operation. */
  resume(batchId: EntityId): Promise<BatchProgress>;
  /** Requests cancellation without deleting durable state. */
  cancel(batchId: EntityId): Promise<BatchProgress>;
}

/** Trusted worker boundary that authorizes and executes one logical batch. */
export interface BatchWorkerPort {
  run(batchId: EntityId, access: AccessContext): Promise<BatchProgress>;
}
