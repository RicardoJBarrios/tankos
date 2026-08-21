import type { EntityId } from './entity-id';
import type { LifecycleStatus } from './lifecycle';
import type { PageRequest } from './pagination';

/** Query contract shared by all CRUD repositories. */
export interface ListRequest<TFilter = unknown> {
  readonly page: PageRequest;
  readonly filter?: TFilter;
  /** Lifecycle states visible to the caller; adapters must enforce access. */
  readonly lifecycle?: readonly LifecycleStatus[];
}

/** Request for one record by stable identifier. */
export interface GetRequest {
  readonly id: EntityId;
}

/** Lifecycle command targeting one record. */
export interface RecordCommand {
  readonly id: EntityId;
}
