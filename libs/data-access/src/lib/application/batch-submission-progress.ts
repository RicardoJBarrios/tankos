import type { BatchProgress, BatchSubmissionStorePort } from '../core';
import { createDataAccessError } from '../core';

/** Projects a persisted record to the public progress contract. */
export function project<TPayload>(
  record: Awaited<ReturnType<BatchSubmissionStorePort<TPayload>['get']>>,
): BatchProgress {
  if (!record) throw createDataAccessError('not-found', 'Batch was not found');
  const {
    batchId,
    schema,
    operation,
    status,
    total,
    processed,
    warnings,
    failures,
    createdAt,
    updatedAt,
    currentChunk,
    retryCount,
    leaseOwner,
    leaseUntil,
  } = record;
  return {
    batchId,
    schema,
    operation,
    status,
    total,
    processed,
    warnings,
    failures,
    createdAt,
    updatedAt,
    currentChunk,
    retryCount,
    leaseOwner,
    leaseUntil,
  };
}
