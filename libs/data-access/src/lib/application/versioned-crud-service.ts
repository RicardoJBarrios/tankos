import type {
  AccessContext,
  CreateRequest,
  CrudRecord,
  RecordCommand,
} from '../core';
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
export interface VersionedCrudServiceOptions<TData, TCreate, TUpdate> {
  readonly toCreateInput: (input: TUpdate) => TCreate;
  /** Provider transaction used when the persistence adapter can guarantee atomicity. */
  readonly replaceAtomically?: (
    request: RecordCommand,
    input: TUpdate,
  ) => Promise<CrudRecord<TData>>;
  /** Domain validation that must run before the replacement is created. */
  readonly validateReplace?: (
    access: AccessContext,
    current: CrudRecord<TData>,
    input: TUpdate,
  ) => void | Promise<void>;
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
  options: VersionedCrudServiceOptions<TData, TCreate, TUpdate>,
): VersionedCrudService<TData, TCreate, TUpdate, TFilter> {
  return {
    ...service,
    replace: async (
      request: RecordCommand,
      input: TUpdate,
    ): Promise<CrudRecord<TData>> => {
      await validateReplacement(service, options, request, input);
      if (options.replaceAtomically) {
        return options.replaceAtomically(request, input);
      }
      const created = await service.create({
        access: {
          ...request.access,
          requestId: `${request.id}:replacement:${String(request.expectedRevision)}`,
        },
        input: options.toCreateInput(input),
      } satisfies CreateRequest<TCreate>);
      await service.markForDeletion(request);
      return created;
    },
  };
}

async function validateReplacement<TData, TCreate, TUpdate, TFilter>(
  service: VersionedCrudSource<TData, TCreate, TUpdate, TFilter>,
  options: VersionedCrudServiceOptions<TData, TCreate, TUpdate>,
  request: RecordCommand,
  input: TUpdate,
): Promise<void> {
  if (!options.validateReplace) return;
  const current = await service.get({ access: request.access, id: request.id });
  if (current) await options.validateReplace(request.access, current, input);
}
