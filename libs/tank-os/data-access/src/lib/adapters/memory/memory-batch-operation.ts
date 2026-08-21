import { DataAccessError } from '../../core/errors';
import type {
  BatchItemResult,
  BatchOperationPort,
  BatchProgress,
  BatchRequest,
  EntityId,
  TechnicalTimestamp,
  AccessContext,
} from '../../core';
import type { ClockPort } from '@tank-os/time';
import {
  createAccessContext,
  createBatchRequest,
  createEntityId,
} from '../../core';

/** Dependencies for deterministic asynchronous batch tests and prototypes. */
export interface InMemoryBatchOperationOptions<TPayload, TFilter> {
  readonly clock: ClockPort;
  readonly materialize: (
    selection: BatchRequest<TPayload, TFilter>['selection'],
  ) => readonly EntityId[];
  readonly execute: (
    id: EntityId,
    request: BatchRequest<TPayload, TFilter>,
  ) => Promise<BatchItemResult>;
  readonly chunkSize?: number;
  /** Maximum number of item commands executed concurrently in one chunk. */
  readonly concurrency?: number;
  /** Roles allowed to execute the in-memory worker. */
  readonly workerRoles?: readonly string[];
}

/** In-memory logical batch port; `run` simulates the trusted worker boundary. */
export interface InMemoryBatchOperationPort<
  TPayload,
  TFilter,
> extends BatchOperationPort<TPayload, TFilter> {
  run(batchId: EntityId, access: AccessContext): Promise<BatchProgress>;
}

type StoredBatchOperation<TPayload, TFilter> = BatchProgress & {
  readonly request: BatchRequest<TPayload, TFilter>;
  readonly ids: readonly EntityId[];
  readonly fingerprint: string;
  readonly requestFingerprint: string;
};

function failedItem(id: EntityId, error: unknown): BatchItemResult {
  const knownError = error instanceof Error ? error : undefined;
  return {
    id,
    outcome: 'failed',
    code: knownError?.name ?? 'unknown',
    message: knownError?.message ?? 'Unknown failure',
  };
}

function updateProgress(
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

function initialProgress<TPayload, TFilter>(
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

function requestFingerprint<TPayload, TFilter>(
  request: BatchRequest<TPayload, TFilter>,
): string {
  return JSON.stringify({
    schema: request.schema,
    operation: request.operation,
    selection: request.selection,
    payload: request.payload,
  });
}

function fingerprint<TPayload, TFilter>(
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

function publicProgress<TPayload, TFilter>(
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

async function executeWithConcurrency<TItem, TResult>(
  items: readonly TItem[],
  concurrency: number,
  execute: (item: TItem) => Promise<TResult>,
): Promise<TResult[]> {
  const results = new Array<TResult>(items.length);
  let nextIndex = 0;
  const worker = async (): Promise<void> => {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await execute(items[index]);
    }
  };
  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker()),
  );
  return results;
}

async function executeMemoryBatch<TPayload, TFilter>(
  batchId: EntityId,
  operation: StoredBatchOperation<TPayload, TFilter>,
  options: InMemoryBatchOperationOptions<TPayload, TFilter>,
  chunkSize: number,
  concurrency: number,
  operations: Map<EntityId, StoredBatchOperation<TPayload, TFilter>>,
): Promise<BatchProgress> {
  const ids = operation.ids;
  let current: BatchProgress = initialProgress(
    operation,
    ids.length,
    options.clock.now(),
  );
  for (let offset = 0; offset < ids.length; offset += chunkSize) {
    const chunk = ids.slice(offset, offset + chunkSize);
    const executeItem = async (id: EntityId): Promise<BatchItemResult> => {
      try {
        return await options.execute(id, operation.request);
      } catch (error) {
        return failedItem(id, error);
      }
    };
    const results = await executeWithConcurrency(chunk, concurrency, executeItem);
    current = updateProgress(current, createEntityId(`chunk-${Math.floor(offset / chunkSize) + 1}`), results, options.clock.now());
    /* c8 ignore next -- V8 reports object spread in the async loop as a synthetic branch. */
    operations.set(batchId, { ...operation, ...current });
  }
  /* c8 ignore next -- V8 reports the async terminal object as a synthetic branch. */
  const terminal: StoredBatchOperation<TPayload, TFilter> = {
    /* c8 ignore next -- V8 reports object spread in the terminal snapshot as a synthetic branch. */
    ...operation,
    ...current,
    status:
      current.failures > 0
        ? ('failed' as const)
        : current.warnings > 0
          ? ('completed-with-warnings' as const)
          : ('completed' as const),
  };
  operations.set(batchId, terminal);
  return publicProgress(terminal);
}

/** Creates an asynchronous batch adapter with frozen scope and chunking. */
export function createInMemoryBatchOperation<
  TPayload = unknown,
  TFilter = unknown,
>(
  options: InMemoryBatchOperationOptions<TPayload, TFilter>,
): InMemoryBatchOperationPort<TPayload, TFilter> {
  const operations = new Map<
    EntityId,
    StoredBatchOperation<TPayload, TFilter>
  >();
  const idempotency = new Map<string, EntityId>();
  const running = new Set<EntityId>();
  let sequence = 0;
  const chunkSize = options.chunkSize ?? 400;
  const concurrency = options.concurrency ?? 8;
  const workerRoles = new Set(
    options.workerRoles ?? ['worker', 'administrator'],
  );

  if (!Number.isInteger(chunkSize) || chunkSize < 1 || chunkSize > 400) {
    throw new RangeError(
      'Batch chunk size must be an integer between 1 and 400',
    );
  }
  if (!Number.isInteger(concurrency) || concurrency < 1 || concurrency > 32) {
    throw new RangeError(
      'Batch concurrency must be an integer between 1 and 32',
    );
  }

  function progress(request: BatchRequest<TPayload, TFilter>): BatchProgress {
    const now = options.clock.now();
    return {
      batchId: createEntityId(`batch-${++sequence}`),
      schema: request.schema,
      operation: request.operation,
      status: 'materializing',
      total: 0,
      processed: 0,
      warnings: 0,
      failures: 0,
      createdAt: now,
      updatedAt: now,
      retryCount: 0,
    };
  }

  return {
    async submit(request) {
      const valid = createBatchRequest(request);
      const idempotencyId = `${valid.access.principalId}:${valid.idempotencyKey}`;
      const previousId = idempotency.get(idempotencyId);
      if (previousId !== undefined) {
        const previous = operations.get(previousId);
        if (previous !== undefined) {
          if (previous.requestFingerprint !== requestFingerprint(valid)) {
            return Promise.reject(
              new DataAccessError(
                'conflict',
                'The idempotency key was already used for a different batch request',
              ),
            );
          }
          return publicProgress(previous);
        }
      }
      const base = progress(valid);
      /* c8 ignore next -- V8 reports object spread in the immutable snapshot as a synthetic branch. */
      const frozen = {
        ...base,
        total: 0,
        request: valid,
        /* c8 ignore next -- V8 reports the type assertion as a synthetic branch. */
        ids: [] as readonly EntityId[],
        /* c8 ignore next -- V8 reports the empty immutable snapshot branch as synthetic. */
        fingerprint: fingerprint(valid, []),
        requestFingerprint: requestFingerprint(valid),
      };
      operations.set(base.batchId, frozen);
      idempotency.set(idempotencyId, base.batchId);
      return publicProgress(frozen);
    },
    async materialize(batchId) {
      const operation = operations.get(batchId);
      if (!operation)
        throw new DataAccessError('not-found', 'Batch was not found');
      if (operation.status !== 'materializing') return publicProgress(operation);
      const ids = [...options.materialize(operation.request.selection)];
      const updated = {
        ...operation,
        ids,
        total: ids.length,
        status: 'queued' as const,
        fingerprint: fingerprint(operation.request, ids),
        updatedAt: options.clock.now(),
      };
      operations.set(batchId, updated);
      return publicProgress(updated);
    },
    async get(batchId) {
      const operation = operations.get(batchId);
      if (!operation) return undefined;
      return publicProgress(operation);
    },
    async resume(batchId) {
      const operation = operations.get(batchId);
      if (!operation)
        throw new DataAccessError('not-found', 'Batch was not found');
      const updated = {
        ...operation,
        status: 'queued' as const,
        updatedAt: options.clock.now(),
      };
      operations.set(batchId, updated);
      return publicProgress(updated);
    },
    async cancel(batchId) {
      const operation = operations.get(batchId);
      if (!operation)
        throw new DataAccessError('not-found', 'Batch was not found');
      const cancelled = {
        ...operation,
        status: 'cancelled' as const,
        updatedAt: options.clock.now(),
      };
      operations.set(batchId, cancelled);
      return publicProgress(cancelled);
    },
    async run(batchId, access) {
      const workerAccess = createAccessContext(access);
      if (!workerAccess.roles.some((role) => workerRoles.has(role))) {
        throw new DataAccessError(
          'forbidden',
          'Only a trusted worker may run a batch',
        );
      }
      if (running.has(batchId)) {
        throw new DataAccessError('conflict', 'Batch is already running');
      }
      const operation = operations.get(batchId);
      if (!operation)
        throw new DataAccessError('not-found', 'Batch was not found');
      if (operation.status === 'materializing') {
        throw new DataAccessError(
          'validation',
          'Batch must be materialized before execution',
        );
      }
      running.add(batchId);
      return executeMemoryBatch(
        batchId,
        operation,
        options,
        chunkSize,
        concurrency,
        operations,
      ).finally(() => running.delete(batchId));
    },
  };
}
