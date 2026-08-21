import type { EntityId } from './entity-id';

/** Operation supported by the reusable batch boundary. */
export type BatchOperation = 'update' | 'mark-for-deletion' | 'delete';

/** Execution state of an asynchronous batch. */
export type BatchStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'completed-with-warnings'
  | 'failed'
  | 'cancelled';

/** Immutable scope and command submitted for asynchronous execution. */
export interface BatchRequest<TPayload = unknown> {
  readonly schema: string;
  readonly operation: BatchOperation;
  readonly ids: readonly EntityId[];
  readonly payload?: TPayload;
}

/** Progress projection returned without waiting for execution. */
export interface BatchProgress {
  readonly batchId: EntityId;
  readonly schema: string;
  readonly status: BatchStatus;
  readonly total: number;
  readonly processed: number;
  readonly warnings: number;
  readonly failures: number;
}
