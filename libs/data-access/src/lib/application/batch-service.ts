import type {
  BatchOperationPort,
  BatchProgress,
  BatchRequest,
  EntityId,
} from '../core';
import { createBatchRequest } from '../core';

/** Composable application API for asynchronous batch operations. */
export interface BatchService<TPayload = unknown, TFilter = unknown> {
  submit(request: BatchRequest<TPayload, TFilter>): Promise<BatchProgress>;
  materialize(batchId: EntityId): Promise<BatchProgress>;
  get(batchId: EntityId): Promise<BatchProgress | undefined>;
  resume(batchId: EntityId): Promise<BatchProgress>;
  cancel(batchId: EntityId): Promise<BatchProgress>;
}

/** Composes batch use cases around an execution port. */
export function createBatchService<TPayload = unknown, TFilter = unknown>(
  execution: BatchOperationPort<TPayload, TFilter>,
): BatchService<TPayload, TFilter> {
  return {
    submit: (request) =>
      Promise.resolve().then(() => execution.submit(createBatchRequest(request))),
    materialize: (batchId) => execution.materialize(batchId),
    get: (batchId) => execution.get(batchId),
    resume: (batchId) => execution.resume(batchId),
    cancel: (batchId) => execution.cancel(batchId),
  };
}
