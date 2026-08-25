import { DataAccessError } from '../../core/errors';
import type {
  BatchItemResult,
  BatchProgress,
  BatchRequest,
  EntityId,
  TechnicalTimestamp,
} from '../../core';
import { createEntityId } from '../../core';
import type { InMemoryBatchOperationOptions } from './memory-batch-operation';

/** Internal persisted batch state. */
export type StoredBatchOperation<TPayload, TFilter> = BatchProgress & {
  readonly request: BatchRequest<TPayload, TFilter>;
  readonly ids: readonly EntityId[];
  readonly fingerprint: string;
  readonly requestFingerprint: string;
};

/** Converts an item exception to the stable batch result shape. */
export function failedItem(id: EntityId, error: unknown): BatchItemResult {
  const knownError = error instanceof Error ? error : undefined;
  return {
    id,
    outcome: 'failed',
    code: knownError?.name ?? 'unknown',
    message: knownError?.message ?? 'Unknown failure',
  };
}

/** Applies one completed chunk to the progress snapshot. */
export function updateProgress(
  current: BatchProgress,
  chunkId: EntityId,
  results: readonly BatchItemResult[],
  now: TechnicalTimestamp,
): BatchProgress {
  return {
    ...current,
    currentChunk: chunkId,
    processed: current.processed + results.length,
    warnings:
      current.warnings +
      results.filter((result) => result.outcome === 'warning').length,
    failures:
      current.failures +
      results.filter((result) => result.outcome === 'failed').length,
    updatedAt: now,
    retryCount: current.retryCount + 1,
  };
}

/** Projects the initial state before materialization. */
export function initialProgress<TPayload, TFilter>(
  operation: StoredBatchOperation<TPayload, TFilter>,
  total: number,
  updatedAt: TechnicalTimestamp,
): BatchProgress {
  return {
    batchId: operation.batchId,
    schema: operation.schema,
    operation: operation.operation,
    status: operation.status,
    total,
    processed: operation.processed,
    warnings: operation.warnings,
    failures: operation.failures,
    createdAt: operation.createdAt,
    updatedAt,
    currentChunk: operation.currentChunk,
    retryCount: operation.retryCount,
  };
}

/** Produces a stable identity for a complete request. */
export function requestFingerprint<TPayload, TFilter>(
  request: BatchRequest<TPayload, TFilter>,
): string {
  return JSON.stringify({
    schema: request.schema,
    operation: request.operation,
    selection: request.selection,
    payload: request.payload,
  });
}

/** Produces a stable identity for a materialized request. */
export function fingerprint<TPayload, TFilter>(
  request: BatchRequest<TPayload, TFilter>,
  ids: readonly EntityId[],
): string {
  return JSON.stringify({
    schema: request.schema,
    operation: request.operation,
    selection: request.selection,
    ids: [...ids],
    payload: request.payload,
  });
}

/** Hides implementation-only fields from the public progress port. */
export function publicProgress<TPayload, TFilter>(
  operation: StoredBatchOperation<TPayload, TFilter>,
): BatchProgress {
  return {
    batchId: operation.batchId,
    schema: operation.schema,
    operation: operation.operation,
    status: operation.status,
    total: operation.total,
    processed: operation.processed,
    warnings: operation.warnings,
    failures: operation.failures,
    createdAt: operation.createdAt,
    updatedAt: operation.updatedAt,
    currentChunk: operation.currentChunk,
    retryCount: operation.retryCount,
  };
}

/** Resolves the final status from item outcomes. */
export function terminalStatus(
  failures: number,
  warnings: number,
): BatchProgress['status'] {
  if (failures > 0) return 'failed';
  if (warnings > 0) return 'completed-with-warnings';
  return 'completed';
}

/** Executes items with a bounded number of concurrent workers. */
export async function executeWithConcurrency<TItem, TResult>(
  items: readonly TItem[],
  concurrency: number,
  execute: (item: TItem) => Promise<TResult>,
): Promise<TResult[]> {
  const results = new Array<TResult>(items.length);
  let nextIndex = 0;
  await Promise.all(
    Array.from(
      { length: Math.min(concurrency, items.length) },
      async (): Promise<void> => {
        while (nextIndex < items.length) {
          const index = nextIndex++;
          results[index] = await execute(items[index]);
        }
      },
    ),
  );
  return results;
}

/** Runs all materialized chunks and persists each progress transition. */
export async function executeMemoryBatch<TPayload, TFilter>(
  batchId: EntityId,
  operation: StoredBatchOperation<TPayload, TFilter>,
  options: InMemoryBatchOperationOptions<TPayload, TFilter>,
  chunkSize: number,
  concurrency: number,
  operations: Map<EntityId, StoredBatchOperation<TPayload, TFilter>>,
): Promise<BatchProgress> {
  let current = initialProgress(
    operation,
    operation.ids.length,
    options.clock.now(),
  );
  for (let offset = 0; offset < operation.ids.length; offset += chunkSize) {
    const chunk = operation.ids.slice(offset, offset + chunkSize);
    const results = await executeWithConcurrency(
      chunk,
      concurrency,
      async (id) => {
        try {
          return await options.execute(id, operation.request);
        } catch (error) {
          return failedItem(id, error);
        }
      },
    );
    current = updateProgress(
      current,
      createEntityId(`chunk-${Math.floor(offset / chunkSize) + 1}`),
      results,
      options.clock.now(),
    );
    operations.set(batchId, { ...operation, ...current });
  }
  const terminal = {
    ...operation,
    ...current,
    status: terminalStatus(current.failures, current.warnings),
  } as StoredBatchOperation<TPayload, TFilter>;
  operations.set(batchId, terminal);
  return publicProgress(terminal);
}

/** Creates an in-memory initial operation snapshot. */
export function createInitialOperation<TPayload, TFilter>(
  request: BatchRequest<TPayload, TFilter>,
  now: TechnicalTimestamp,
  batchId: EntityId,
): StoredBatchOperation<TPayload, TFilter> {
  return {
    batchId,
    schema: request.schema,
    operation: request.operation,
    status: 'materializing',
    total: 0,
    processed: 0,
    warnings: 0,
    failures: 0,
    createdAt: now,
    updatedAt: now,
    currentChunk: undefined,
    retryCount: 0,
    request,
    ids: [],
    fingerprint: fingerprint(request, []),
    requestFingerprint: requestFingerprint(request),
  };
}

/** Converts an unknown execution failure into the data-access error model. */
export function batchError(
  code: 'not-found' | 'forbidden' | 'conflict' | 'validation',
  message: string,
): DataAccessError {
  return new DataAccessError(code, message);
}
