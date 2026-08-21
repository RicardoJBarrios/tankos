import type {
  BatchOperationPort,
  BatchProgress,
  BatchRequest,
  EntityId,
} from '../core';

/** Composable application API for asynchronous batch operations. */
export interface BatchService<TPayload = unknown> {
  submit(request: BatchRequest<TPayload>): Promise<BatchProgress>;
  get(batchId: EntityId): Promise<BatchProgress | undefined>;
}

/** Composes batch use cases around an execution port. */
export function createBatchService<TPayload = unknown>(
  execution: BatchOperationPort<TPayload>,
): BatchService<TPayload> {
  return {
    submit: (request) => execution.submit(request),
    get: (batchId) => execution.get(batchId),
  };
}
