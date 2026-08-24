import type { BatchWorkerPort, BatchExecutionPort } from '../core';

export type { BatchAuthorizationPort, BatchExecutionPort } from '../core';

/** Composes a trusted execution boundary with the caller identity. */
export function createAuthorizedBatchWorker(
  execution: BatchExecutionPort,
): BatchWorkerPort {
  return {
    async run(batchId, access) {
      return execution.run(batchId, access.principalId);
    },
  };
}
