import type {
  AccessContext,
  CrudRecord,
  CreateRequest,
  EntityId,
} from '../core';

export type CrudOperation =
  | 'list'
  | 'get'
  | 'create'
  | 'replace'
  | 'markForDeletion'
  | 'restore'
  | 'delete';

/** Neutral authorization and validation extension for one CRUD aggregate. */
export interface CrudPolicy<TData, TCreate, TUpdate> {
  authorize(
    request: CrudPolicyRequest<TData, TCreate, TUpdate>,
  ): void | Promise<void>;
  validateCreate?(request: CreateRequest<TCreate>): void | Promise<void>;
  validateUpdate?(
    access: AccessContext,
    current: CrudRecord<TData>,
    input: TUpdate,
  ): void | Promise<void>;
}

export interface CrudPolicyRequest<TData, TCreate, TUpdate> {
  readonly operation: CrudOperation;
  readonly access: AccessContext;
  readonly id?: EntityId;
  readonly record?: CrudRecord<TData>;
  readonly input?: TCreate | TUpdate;
}
