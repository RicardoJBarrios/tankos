import { DataAccessError } from '../../core/errors';
import type { BatchProgress, BatchRequest, EntityId } from '../../core';
import {
  createAccessContext,
  createBatchRequest,
  createEntityId,
} from '../../core';
import type {
  InMemoryBatchOperationOptions,
  InMemoryBatchOperationPort,
} from './memory-batch-operation';
import {
  createInitialOperation,
  executeMemoryBatch,
  fingerprint,
  publicProgress,
  requestFingerprint,
  batchError,
  type StoredBatchOperation,
} from './memory-batch-operation-support';

/** Stateful implementation behind the in-memory batch factory. */
export class MemoryBatchOperationImplementation<
  TPayload,
  TFilter,
> implements InMemoryBatchOperationPort<TPayload, TFilter> {
  readonly #options: InMemoryBatchOperationOptions<TPayload, TFilter>;
  readonly #operations = new Map<
    EntityId,
    StoredBatchOperation<TPayload, TFilter>
  >();
  readonly #idempotency = new Map<string, EntityId>();
  readonly #running = new Set<EntityId>();
  readonly #chunkSize: number;
  readonly #concurrency: number;
  readonly #workerRoles: Set<string>;
  #sequence = 0;

  constructor(options: InMemoryBatchOperationOptions<TPayload, TFilter>) {
    this.#options = options;
    this.#chunkSize = options.chunkSize ?? 400;
    this.#concurrency = options.concurrency ?? 8;
    this.#workerRoles = new Set(
      options.workerRoles ?? ['worker', 'administrator'],
    );
    this.#validateConfiguration();
  }

  submit(request: BatchRequest<TPayload, TFilter>): Promise<BatchProgress> {
    return Promise.resolve().then(() => this.#submit(request));
  }

  async materialize(batchId: EntityId): Promise<BatchProgress> {
    const operation = this.#require(batchId);
    if (operation.status !== 'materializing') return publicProgress(operation);
    const ids = [...this.#options.materialize(operation.request.selection)];
    const updated = {
      ...operation,
      ids,
      total: ids.length,
      status: 'queued' as const,
      fingerprint: fingerprint(operation.request, ids),
      updatedAt: this.#options.clock.now(),
    };
    this.#operations.set(batchId, updated);
    return publicProgress(updated);
  }

  async get(batchId: EntityId): Promise<BatchProgress | undefined> {
    const operation = this.#operations.get(batchId);
    return operation ? publicProgress(operation) : undefined;
  }

  async resume(batchId: EntityId): Promise<BatchProgress> {
    const operation = this.#require(batchId);
    const updated = {
      ...operation,
      status: 'queued' as const,
      updatedAt: this.#options.clock.now(),
    };
    this.#operations.set(batchId, updated);
    return publicProgress(updated);
  }

  async cancel(batchId: EntityId): Promise<BatchProgress> {
    const operation = this.#require(batchId);
    const updated = {
      ...operation,
      status: 'cancelled' as const,
      updatedAt: this.#options.clock.now(),
    };
    this.#operations.set(batchId, updated);
    return publicProgress(updated);
  }

  async run(
    batchId: EntityId,
    access: Parameters<typeof createAccessContext>[0],
  ): Promise<BatchProgress> {
    const workerAccess = createAccessContext(access);
    if (!workerAccess.roles.some((role) => this.#workerRoles.has(role)))
      throw batchError('forbidden', 'Only a trusted worker may run a batch');
    if (this.#running.has(batchId))
      throw batchError('conflict', 'Batch is already running');
    const operation = this.#require(batchId);
    if (operation.status === 'materializing')
      throw batchError(
        'validation',
        'Batch must be materialized before execution',
      );
    this.#running.add(batchId);
    return executeMemoryBatch(
      batchId,
      operation,
      this.#options,
      this.#chunkSize,
      this.#concurrency,
      this.#operations,
    ).finally(() => this.#running.delete(batchId));
  }

  #validateConfiguration(): void {
    if (
      !Number.isInteger(this.#chunkSize) ||
      this.#chunkSize < 1 ||
      this.#chunkSize > 400
    )
      throw new RangeError(
        'Batch chunk size must be an integer between 1 and 400',
      );
    if (
      !Number.isInteger(this.#concurrency) ||
      this.#concurrency < 1 ||
      this.#concurrency > 32
    )
      throw new RangeError(
        'Batch concurrency must be an integer between 1 and 32',
      );
  }

  #require(batchId: EntityId): StoredBatchOperation<TPayload, TFilter> {
    const operation = this.#operations.get(batchId);
    if (!operation)
      throw new DataAccessError('not-found', 'Batch was not found');
    return operation;
  }

  #submit(input: BatchRequest<TPayload, TFilter>): BatchProgress {
    const request = createBatchRequest(input);
    const key = `${request.access.principalId}:${request.idempotencyKey}`;
    const previousId = this.#idempotency.get(key);
    if (previousId === undefined) return this.#store(request, key);
    const previous = this.#require(previousId);
    if (previous.requestFingerprint !== requestFingerprint(request))
      throw new DataAccessError(
        'conflict',
        'The idempotency key was already used for a different batch request',
      );
    return publicProgress(previous);
  }

  #store(request: BatchRequest<TPayload, TFilter>, key: string): BatchProgress {
    const batchId = createEntityId(`batch-${++this.#sequence}`);
    const operation = createInitialOperation(
      request,
      this.#options.clock.now(),
      batchId,
    );
    this.#operations.set(batchId, operation);
    this.#idempotency.set(key, batchId);
    return publicProgress(operation);
  }
}
