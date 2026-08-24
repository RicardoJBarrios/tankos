import type { ClockPort } from '@tankos/time';
import type { CrudRecord, CrudRepositoryPort } from '../../core';
import { MemoryCrudRepository } from './memory-crud-repository-implementation';

/** Dependencies needed to create a deterministic in-memory repository. */
export interface InMemoryCrudRepositoryOptions<
  TData,
  TCreate,
  TUpdate,
  TFilter,
> {
  readonly initialRecords?: readonly CrudRecord<TData>[];
  readonly create: (
    input: TCreate,
    now: ReturnType<ClockPort['now']>,
  ) => CrudRecord<TData>;
  readonly update: (data: TData, input: TUpdate) => TData;
  readonly matches?: (record: CrudRecord<TData>, filter: TFilter) => boolean;
  readonly clock: ClockPort;
  /** Roles allowed to perform lifecycle operations in this test adapter. */
  readonly elevatedRoles?: readonly string[];
}

/** In-memory CRUD adapter for deterministic tests and local prototypes. */
export function createInMemoryCrudRepository<
  TData,
  TCreate,
  TUpdate,
  TFilter = unknown,
>(
  options: InMemoryCrudRepositoryOptions<TData, TCreate, TUpdate, TFilter>,
): CrudRepositoryPort<TData, TCreate, TUpdate, TFilter> {
  return new MemoryCrudRepository(options);
}
