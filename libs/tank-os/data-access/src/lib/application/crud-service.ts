import type { CrudRepositoryPort } from '../core';
import type {
  CrudRecord,
  GetRequest,
  ListRequest,
  Page,
  RecordCommand,
} from '../core';

/** Composable application API for one entity's CRUD lifecycle. */
export interface CrudService<TData, TCreate, TUpdate, TFilter = unknown> {
  list(request: ListRequest<TFilter>): Promise<Page<CrudRecord<TData>>>;
  get(request: GetRequest): Promise<CrudRecord<TData> | undefined>;
  create(input: TCreate): Promise<CrudRecord<TData>>;
  replace(request: RecordCommand, input: TUpdate): Promise<CrudRecord<TData>>;
  markForDeletion(request: RecordCommand): Promise<CrudRecord<TData>>;
  restore(request: RecordCommand): Promise<CrudRecord<TData>>;
  delete(request: RecordCommand): Promise<void>;
}

/** Composes CRUD use cases around a provider-specific repository port. */
export function createCrudService<TData, TCreate, TUpdate, TFilter = unknown>(
  repository: CrudRepositoryPort<TData, TCreate, TUpdate, TFilter>,
): CrudService<TData, TCreate, TUpdate, TFilter> {
  return {
    list: (request) => repository.list(request),
    get: (request) => repository.get(request),
    create: (input) => repository.create(input),
    replace: (request, input) => repository.replace(request, input),
    markForDeletion: (request) => repository.markForDeletion(request),
    restore: (request) => repository.restore(request),
    delete: (request) => repository.delete(request),
  };
}
