import type {
  CrudRecord,
  CrudRepositoryPort,
  ListRequest,
  Page,
  RecordCommand,
  CreateRequest,
  GetRequest,
} from '@tankos/data-access';

/**
 * Adapts a DTO CRUD repository to a domain CRUD repository by parsing every
 * returned record at the adapter boundary.
 */
export function createMappedFirestoreCrudRepository<
  TDto,
  TData,
  TCreate,
  TUpdate,
  TFilter,
>(
  repository: CrudRepositoryPort<TDto, TCreate, TUpdate, TFilter>,
  parse: (value: TDto) => TData,
): CrudRepositoryPort<TData, TCreate, TUpdate, TFilter> {
  const mapRecord = (
    record: CrudRecord<TDto> | undefined,
  ): CrudRecord<TData> | undefined =>
    record ? { ...record, data: parse(record.data) } : undefined;
  const mapRequiredRecord = (record: CrudRecord<TDto>): CrudRecord<TData> =>
    mapRecord(record) as CrudRecord<TData>;
  const mapPage = (page: Page<CrudRecord<TDto>>): Page<CrudRecord<TData>> => ({
    ...page,
    items: page.items.map(mapRequiredRecord),
  });

  return {
    list: async (request: ListRequest<TFilter>) =>
      mapPage(await repository.list(request)),
    get: async (request: GetRequest) =>
      mapRecord(await repository.get(request)),
    create: async (request: CreateRequest<TCreate>) =>
      mapRequiredRecord(await repository.create(request)),
    replace: async (request: RecordCommand, input: TUpdate) =>
      mapRequiredRecord(await repository.replace(request, input)),
    markForDeletion: async (request: RecordCommand) =>
      mapRequiredRecord(await repository.markForDeletion(request)),
    restore: async (request: RecordCommand) =>
      mapRequiredRecord(await repository.restore(request)),
    delete: (request: RecordCommand) => repository.delete(request),
  };
}
