import type {
  BatchAuthorizationPort,
  BatchWorkerPort,
  BatchExecutionPort,
} from '../core';

export type { BatchAuthorizationPort, BatchExecutionPort } from '../core';

/** Composes authorization and execution so browsers cannot run bulk writes. */
export function createAuthorizedBatchWorker(
  authorization: BatchAuthorizationPort,
  execution: BatchExecutionPort,
): BatchWorkerPort {
  return {
    async run(batchId, access) {
      await authorization.authorize(batchId, access);
      return execution.run(batchId);
    },
  };
}
