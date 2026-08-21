import type {
  CrudRecord,
  GetRequest,
  ListRequest,
  Page,
  RecordCommand,
} from '../value-types';

/** Port for one entity's CRUD and lifecycle persistence operations. */
export interface CrudRepositoryPort<
  TData,
  TCreate,
  TUpdate,
  TFilter = unknown,
> {
  list(request: ListRequest<TFilter>): Promise<Page<CrudRecord<TData>>>;
  get(request: GetRequest): Promise<CrudRecord<TData> | undefined>;
  create(input: TCreate): Promise<CrudRecord<TData>>;
  replace(request: RecordCommand, input: TUpdate): Promise<CrudRecord<TData>>;
  markForDeletion(request: RecordCommand): Promise<CrudRecord<TData>>;
  restore(request: RecordCommand): Promise<CrudRecord<TData>>;
  delete(request: RecordCommand): Promise<void>;
}
