import type { EntityId } from './entity-id';

/** Bounded request for a cursor-based page. */
export interface PageRequest {
  readonly pageSize: number;
  readonly after?: EntityId;
}

/** Result of a cursor-based page query. */
export interface Page<TRecord> {
  readonly items: readonly TRecord[];
  readonly nextCursor?: EntityId;
  readonly hasMore: boolean;
}
