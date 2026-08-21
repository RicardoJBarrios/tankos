import { DataAccessError } from '../../core/errors';
import type {
  BatchItemResult,
  BatchOperationPort,
  BatchProgress,
  BatchRequest,
  EntityId,
  ServerTimestamp,
  AccessContext,
} from '../../core';
import {
  createAccessContext,
  createBatchRequest,
  createEntityId,
} from '../../core';

/** Dependencies for deterministic asynchronous batch tests and prototypes. */
export interface InMemoryBatchOperationOptions<TPayload, TFilter> {
  readonly now: () => ServerTimestamp;
  readonly materialize: (
    selection: BatchRequest<TPayload, TFilter>['selection'],
  ) => readonly EntityId[];
  readonly execute: (
    id: EntityId,
    request: BatchRequest<TPayload, TFilter>,
  ) => Promise<BatchItemResult>;
  readonly chunkSize?: number;
  /** Roles allowed to execute the in-memory worker. */
  readonly workerRoles?: readonly string[];
}

/** In-memory logical batch port; `run` simulates the trusted worker boundary. */
export interface InMemoryBatchOperationPort<TPayload, TFilter>
  extends BatchOperationPort<TPayload, TFilter> {
  run(batchId: EntityId, access: AccessContext): Promise<BatchProgress>;
}

type StoredBatchOperation<TPayload, TFilter> = BatchProgress & {
  readonly request: BatchRequest<TPayload, TFilter>;
  readonly ids: readonly EntityId[];
  readonly fingerprint: string;
  readonly requestFingerprint: string;
};

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

/** Creates an asynchronous batch adapter with frozen scope and chunking. */
export function createInMemoryBatchOperation<
  TPayload = unknown,
  TFilter = unknown,
>(
  options: InMemoryBatchOperationOptions<TPayload, TFilter>,
): InMemoryBatchOperationPort<TPayload, TFilter> {
  const operations = new Map<EntityId, StoredBatchOperation<TPayload, TFilter>>();
  const idempotency = new Map<string, EntityId>();
  const running = new Set<EntityId>();
  let sequence = 0;
  const chunkSize = options.chunkSize ?? 400;
  const workerRoles = new Set(options.workerRoles ?? ['worker', 'administrator']);

  if (!Number.isInteger(chunkSize) || chunkSize < 1 || chunkSize > 400) {
    throw new RangeError('Batch chunk size must be an integer between 1 and 400');
  }

  function progress(request: BatchRequest<TPayload, TFilter>): BatchProgress {
    const now = options.now();
    return {
      batchId: createEntityId(`batch-${++sequence}`),
      schema: request.schema,
      operation: request.operation,
      status: 'queued',
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
            throw new DataAccessError(
              'conflict',
              'The idempotency key was already used for a different batch request',
            );
          }
          return publicProgress(previous);
        }
      }
      const base = progress(valid);
      const ids = [...options.materialize(valid.selection)];
      const frozen = {
        ...base,
        total: ids.length,
        request: valid,
        ids,
        fingerprint: fingerprint(valid, ids),
        requestFingerprint: requestFingerprint(valid),
      };
      operations.set(base.batchId, frozen);
      idempotency.set(idempotencyId, base.batchId);
      return publicProgress(frozen);
    },
    async get(batchId) {
      const operation = operations.get(batchId);
      if (!operation) return undefined;
      return publicProgress(operation);
    },
    async resume(batchId) {
      const operation = operations.get(batchId);
      if (!operation) throw new DataAccessError('not-found', 'Batch was not found');
      const updated = { ...operation, status: 'queued' as const, updatedAt: options.now() };
      operations.set(batchId, updated);
      return publicProgress(updated);
    },
    async cancel(batchId) {
      const operation = operations.get(batchId);
      if (!operation) throw new DataAccessError('not-found', 'Batch was not found');
      const cancelled = { ...operation, status: 'cancelled' as const, updatedAt: options.now() };
      operations.delete(batchId);
      return publicProgress(cancelled);
    },
    async run(batchId, access) {
      const workerAccess = createAccessContext(access);
      if (!workerAccess.roles.some((role) => workerRoles.has(role))) {
        throw new DataAccessError('forbidden', 'Only a trusted worker may run a batch');
      }
      if (running.has(batchId)) {
        throw new DataAccessError('conflict', 'Batch is already running');
      }
      const operation = operations.get(batchId);
      if (!operation) throw new DataAccessError('not-found', 'Batch was not found');
      running.add(batchId);
      try {
        const ids = operation.ids;
        let current: BatchProgress = {
          ...operation,
          status: 'running',
          total: ids.length,
          updatedAt: options.now(),
        };
        for (let offset = 0; offset < ids.length; offset += chunkSize) {
          const chunk = ids.slice(offset, offset + chunkSize);
          const results = await Promise.all(
            chunk.map(async (id) => {
              try {
                return await options.execute(id, operation.request);
              } catch (error) {
                return {
                  id,
                  outcome: 'failed' as const,
                  code: error instanceof Error ? error.name : 'unknown',
                  message: error instanceof Error ? error.message : 'Unknown failure',
                };
              }
            }),
          );
          current = {
            ...current,
            currentChunk: createEntityId(`chunk-${Math.floor(offset / chunkSize) + 1}`),
            processed: current.processed + results.length,
            warnings: current.warnings + results.filter((result) => result.outcome === 'warning').length,
            failures: current.failures + results.filter((result) => result.outcome === 'failed').length,
            updatedAt: options.now(),
            retryCount: current.retryCount + 1,
          };
          operations.set(batchId, { ...operation, ...current });
        }
        const terminal = {
          ...current,
          status: current.warnings > 0 || current.failures > 0 ? 'completed-with-warnings' as const : 'completed' as const,
        };
        operations.delete(batchId);
        return terminal;
      } finally {
        running.delete(batchId);
      }
    },
  };
}
