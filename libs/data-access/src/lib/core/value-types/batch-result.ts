import type { EntityId } from './entity-id';

/** Classification for an item outcome that does not abort the batch. */
export type BatchOutcome = 'succeeded' | 'warning' | 'failed';

/** Per-item execution result retained while the temporary operation exists. */
export interface BatchItemResult {
  readonly id: EntityId;
  readonly outcome: BatchOutcome;
  readonly code?: string;
  readonly message?: string;
}

/** Structured warning owned by the temporary batch operation. */
export interface BatchWarning {
  readonly code: string;
  readonly message: string;
  readonly itemId?: EntityId;
}
