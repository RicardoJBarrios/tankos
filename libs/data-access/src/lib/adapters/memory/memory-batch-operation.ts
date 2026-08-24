import type { ClockPort } from '@tankos/time';
import type {
  BatchItemResult,
  BatchOperationPort,
  BatchRequest,
  EntityId,
  AccessContext,
} from '../../core';
import type { BatchProgress } from '../../core';
import { MemoryBatchOperationImplementation } from './memory-batch-operation-implementation';

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

/** Creates an asynchronous batch adapter with frozen scope and chunking. */
export function createInMemoryBatchOperation<
  TPayload = unknown,
  TFilter = unknown,
>(
  options: InMemoryBatchOperationOptions<TPayload, TFilter>,
): InMemoryBatchOperationPort<TPayload, TFilter> {
  return new MemoryBatchOperationImplementation(options);
}
