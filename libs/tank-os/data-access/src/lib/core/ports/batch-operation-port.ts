import type { BatchProgress, BatchRequest, EntityId } from '../value-types';

/** Port for submitting and observing asynchronous batch operations. */
export interface BatchOperationPort<TPayload = unknown> {
  submit(request: BatchRequest<TPayload>): Promise<BatchProgress>;
  get(batchId: EntityId): Promise<BatchProgress | undefined>;
}
