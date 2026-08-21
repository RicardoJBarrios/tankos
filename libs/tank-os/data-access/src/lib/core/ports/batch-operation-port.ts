import type { BatchProgress, BatchRequest, EntityId } from '../value-types';

/** Port for submitting and observing asynchronous batch operations. */
export interface BatchOperationPort<TPayload = unknown, TFilter = unknown> {
  submit(request: BatchRequest<TPayload, TFilter>): Promise<BatchProgress>;
  get(batchId: EntityId): Promise<BatchProgress | undefined>;
  resume(batchId: EntityId): Promise<BatchProgress>;
  cancel(batchId: EntityId): Promise<BatchProgress>;
}
