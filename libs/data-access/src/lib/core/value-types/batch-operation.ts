import type { EntityId } from './entity-id';
import type { TechnicalTimestamp } from './record-metadata';
import type { BatchSelection, FrozenBatchScope } from './batch-scope';
import type { AccessContext } from './access-context';
import { createAccessContext } from './access-context';

/** Operation supported by the reusable batch boundary. */
export type BatchOperation = 'update' | 'mark-for-deletion' | 'delete';

/** Execution state of an asynchronous batch. */
export type BatchStatus =
  | 'materializing'
  | 'queued'
  | 'running'
  | 'interrupted'
  | 'completed'
  | 'completed-with-warnings'
  | 'failed'
  | 'cancelled';

/** Immutable scope and command submitted for asynchronous execution. */
export interface BatchRequest<TPayload = unknown, TFilter = unknown> {
  readonly access: AccessContext;
  readonly schema: string;
  readonly operation: BatchOperation;
  readonly selection: BatchSelection<TFilter>;
  /** One confirmation token proves the whole logical scope was confirmed. */
  readonly confirmationToken: string;
  /** Client-generated key making submission idempotent. */
  readonly idempotencyKey: string;
  readonly payload?: TPayload;
}

function assertBatchText(value: unknown, message: string): void {
  if (typeof value !== 'string' || !value.trim()) throw new TypeError(message);
}

function validateBatchSelection<TFilter>(
  selection: BatchSelection<TFilter>,
): void {
  if (!selection || typeof selection !== 'object') {
    throw new TypeError('Batch selection must be an object');
  }
  if (selection.kind === 'filter') return;
  if (selection.kind !== 'ids') {
    throw new TypeError('Batch selection kind is invalid');
  }
  if (!Array.isArray(selection.ids) || selection.ids.length === 0) {
    throw new RangeError('An id batch must contain at least one target');
  }
  if (new Set(selection.ids).size !== selection.ids.length) {
    throw new RangeError('A batch cannot contain duplicate target ids');
  }
}

/** Validates the confirmation and logical selection before submission. */
export function createBatchRequest<TPayload = unknown, TFilter = unknown>(
  request: BatchRequest<TPayload, TFilter>,
): BatchRequest<TPayload, TFilter> {
  assertBatchText(request.schema, 'Batch schema must be a non-empty string');
  const access = createAccessContext(request.access);
  assertBatchText(
    request.confirmationToken,
    'Batch confirmation token must be a non-empty string',
  );
  assertBatchText(
    request.idempotencyKey,
    'Batch idempotency key must be a non-empty string',
  );
  validateBatchSelection(request.selection);
  return { ...request, access };
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
  readonly createdAt: TechnicalTimestamp;
  readonly updatedAt: TechnicalTimestamp;
  readonly currentChunk?: EntityId;
  readonly retryCount: number;
  /** Current trusted worker lease, when one is active. */
  readonly leaseOwner?: string;
  readonly leaseUntil?: TechnicalTimestamp;
}

/** Durable summary record for a logical asynchronous batch. */
export interface BatchOperationRecord<
  TPayload = unknown,
> extends BatchProgress {
  /** Principal that submitted the operation. */
  readonly principalId: EntityId;
  readonly selection: FrozenBatchScope;
  /** Original selection retained while the trusted worker materializes IDs. */
  readonly requestedSelection?: BatchSelection;
  readonly payload?: TPayload;
  /** Fingerprint of the complete request, excluding the idempotency key. */
  readonly requestFingerprint: string;
  /** Host lease preventing concurrent filter materialization. */
  readonly materializationLeaseOwner?: string;
  readonly materializationLeaseToken?: string;
  readonly materializationLeaseUntil?: TechnicalTimestamp;
}
