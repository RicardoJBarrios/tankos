import type { EntityId } from './entity-id';

/** Logical selection submitted before the server freezes a batch. */
export type BatchSelection<TFilter = unknown> =
  | { readonly kind: 'ids'; readonly ids: readonly EntityId[] }
  | { readonly kind: 'filter'; readonly filter: TFilter };

/** Frozen server-side scope summary; physical IDs may live in chunk records. */
export interface FrozenBatchScope {
  /** Stable hash of the final selection and ordering. */
  readonly fingerprint: string;
  /** Number of targets materialized at confirmation time. */
  readonly total: number;
  /** Number of physical chunks holding the target IDs. */
  readonly chunkCount: number;
}

/** One bounded physical execution unit of a logical batch. */
export interface BatchChunk {
  readonly chunkId: EntityId;
  readonly ids: readonly EntityId[];
  readonly status: 'pending' | 'running' | 'completed' | 'failed';
  readonly attempts: number;
}
