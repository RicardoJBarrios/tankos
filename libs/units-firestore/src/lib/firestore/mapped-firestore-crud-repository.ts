import type {
  CrudRecord,
  CrudRepositoryPort,
  ListRequest,
  Page,
  RecordCommand,
  CreateRequest,
  GetRequest,
} from '@tankos/data-access';

function mapRecord<TDto, TData>(
  record: CrudRecord<TDto> | undefined,
  parse: (value: TDto) => TData,
): CrudRecord<TData> | undefined {
  return record ? { ...record, data: parse(record.data) } : undefined;
}

function mapRequiredRecord<TDto, TData>(
  record: CrudRecord<TDto>,
  parse: (value: TDto) => TData,
): CrudRecord<TData> {
  return { ...record, data: parse(record.data) };
}

function mapPage<TDto, TData>(
  page: Page<CrudRecord<TDto>>,
  parse: (value: TDto) => TData,
): Page<CrudRecord<TData>> {
  return {
    ...page,
    items: page.items.map((record) => mapRequiredRecord(record, parse)),
  };
}

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
  const replaceVersioned = repository.replaceVersioned;
  return {
    list: async (request: ListRequest<TFilter>) =>
      mapPage(await repository.list(request), parse),
    get: async (request: GetRequest) =>
      mapRecord(await repository.get(request), parse),
    create: async (request: CreateRequest<TCreate>) =>
      mapRequiredRecord(await repository.create(request), parse),
    replace: async (request: RecordCommand, input: TUpdate) =>
      mapRequiredRecord(await repository.replace(request, input), parse),
    ...(replaceVersioned
      ? {
          replaceVersioned: async (request: RecordCommand, input: TUpdate) =>
            mapRequiredRecord(
              await replaceVersioned(request, input),
              parse,
            ),
        }
      : {}),
    markForDeletion: async (request: RecordCommand) =>
      mapRequiredRecord(await repository.markForDeletion(request), parse),
    restore: async (request: RecordCommand) =>
      mapRequiredRecord(await repository.restore(request), parse),
    delete: (request: RecordCommand) => repository.delete(request),
  };
}
