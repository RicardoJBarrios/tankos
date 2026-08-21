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
  get(batchId: EntityId): Promise<BatchProgress | undefined>;
  resume(batchId: EntityId): Promise<BatchProgress>;
  cancel(batchId: EntityId): Promise<BatchProgress>;
}

/** Composes batch use cases around an execution port. */
export function createBatchService<TPayload = unknown, TFilter = unknown>(
  execution: BatchOperationPort<TPayload, TFilter>,
): BatchService<TPayload, TFilter> {
  return {
    submit: async (request) => execution.submit(createBatchRequest(request)),
    get: (batchId) => execution.get(batchId),
    resume: (batchId) => execution.resume(batchId),
    cancel: (batchId) => execution.cancel(batchId),
  };
}
