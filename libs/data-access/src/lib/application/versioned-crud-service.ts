import type { CreateRequest, CrudRecord, RecordCommand } from '../core';
import type { CrudService } from './crud-service';

/** CRUD service whose replacement creates a new record before retiring the old one. */
export type VersionedCrudService<
  TData,
  TCreate,
  TUpdate,
  TFilter = unknown,
> = CrudService<TData, TCreate, TUpdate, TFilter>;

type VersionedCrudSource<TData, TCreate, TUpdate, TFilter> = Omit<
  CrudService<TData, TCreate, TUpdate, TFilter>,
  'replace'
>;

/** Converts replacement input into the payload of the new version. */
export interface VersionedCrudServiceOptions<TCreate, TUpdate> {
  readonly toCreateInput: (input: TUpdate) => TCreate;
}

/**
 * Applies the shared immutable-version replacement workflow to a CRUD service.
 *
 * The new record is created first and the previous record is then marked for
 * deletion using the caller's expected revision. If the second operation fails,
 * the created record is intentionally preserved for explicit reconciliation.
 */
export function createVersionedCrudService<
  TData,
  TCreate,
  TUpdate,
  TFilter = unknown,
>(
  service: VersionedCrudSource<TData, TCreate, TUpdate, TFilter>,
  options: VersionedCrudServiceOptions<TCreate, TUpdate>,
): VersionedCrudService<TData, TCreate, TUpdate, TFilter> {
  return {
    ...service,
    replace: async (
      request: RecordCommand,
      input: TUpdate,
    ): Promise<CrudRecord<TData>> => {
      const created = await service.create({
        access: {
          ...request.access,
          requestId: `${request.id}:replacement:${request.expectedRevision}`,
        },
        input: options.toCreateInput(input),
      } satisfies CreateRequest<TCreate>);
      await service.markForDeletion(request);
      return created;
    },
  };
}
