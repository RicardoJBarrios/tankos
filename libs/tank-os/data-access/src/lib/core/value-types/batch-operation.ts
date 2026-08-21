import type { EntityId } from './entity-id';
import type { ServerTimestamp } from './record-metadata';
import type { BatchSelection, FrozenBatchScope, BatchChunk } from './batch-scope';
import type { BatchItemResult, BatchWarning } from './batch-result';

/** Operation supported by the reusable batch boundary. */
export type BatchOperation = 'update' | 'mark-for-deletion' | 'delete';

/** Execution state of an asynchronous batch. */
export type BatchStatus =
  | 'queued'
  | 'running'
  | 'interrupted'
  | 'completed'
  | 'completed-with-warnings'
  | 'failed'
  | 'cancelled';

/** Immutable scope and command submitted for asynchronous execution. */
export interface BatchRequest<TPayload = unknown, TFilter = unknown> {
  readonly schema: string;
  readonly operation: BatchOperation;
  readonly selection: BatchSelection<TFilter>;
  /** One confirmation token proves the whole logical scope was confirmed. */
  readonly confirmationToken: string;
  readonly payload?: TPayload;
}

/** Validates the confirmation and logical selection before submission. */
export function createBatchRequest<TPayload = unknown, TFilter = unknown>(
  request: BatchRequest<TPayload, TFilter>,
): BatchRequest<TPayload, TFilter> {
  if (!request.schema.trim()) {
    throw new TypeError('Batch schema must be a non-empty string');
  }
  if (!request.confirmationToken.trim()) {
    throw new TypeError('Batch confirmation token must be a non-empty string');
  }
  if (request.selection.kind === 'ids') {
    if (request.selection.ids.length === 0) {
      throw new RangeError('An id batch must contain at least one target');
    }
    if (new Set(request.selection.ids).size !== request.selection.ids.length) {
      throw new RangeError('A batch cannot contain duplicate target ids');
    }
  }
  return request;
}

/** Progress projection returned without waiting for execution. */
export interface BatchProgress {
  readonly batchId: EntityId;
  readonly schema: string;
  readonly operation: BatchOperation;
  readonly status: BatchStatus;
  readonly total: number;
  readonly processed: number;
  readonly warnings: number;
  readonly failures: number;
  readonly createdAt: ServerTimestamp;
  readonly updatedAt: ServerTimestamp;
  readonly currentChunk?: EntityId;
  readonly retryCount: number;
}

/** Temporary persisted workflow record for a logical asynchronous batch. */
export interface BatchOperationRecord<TPayload = unknown> extends BatchProgress {
  readonly selection: FrozenBatchScope;
  readonly payload?: TPayload;
  readonly chunks: readonly BatchChunk[];
  readonly results: readonly BatchItemResult[];
  readonly warningsDetail: readonly BatchWarning[];
}
