import type { EntityId } from './entity-id';
import type { LifecycleStatus } from './lifecycle';
import type { PageRequest } from './pagination';
import type { AccessContext } from './access-context';

/** Query contract shared by all CRUD repositories. */
export interface ListRequest<TFilter = unknown> {
  readonly access: AccessContext;
  readonly page: PageRequest;
  readonly filter?: TFilter;
  /** Lifecycle states visible to the caller; adapters must enforce access. */
  readonly lifecycle?: readonly LifecycleStatus[];
}

/** Request for one record by stable identifier. */
export interface GetRequest {
  readonly access: AccessContext;
  readonly id: EntityId;
  /** Lifecycle states explicitly visible to this read. */
  readonly lifecycle?: readonly LifecycleStatus[];
}

/** Authenticated creation command for one record. */
export interface CreateRequest<TCreate> {
  readonly access: AccessContext;
  readonly input: TCreate;
}

/** Lifecycle command targeting one record. */
export interface RecordCommand {
  readonly access: AccessContext;
  readonly id: EntityId;
  /** Revision returned by the last read; required for optimistic concurrency. */
  readonly expectedRevision: number;
}
