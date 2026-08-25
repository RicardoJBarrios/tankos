import type { z } from 'zod';
import type {
  CrudRecord,
  CrudRepositoryPort,
  ListRequest,
  Page,
} from '@tankos/data-access';
import type { JsonHttpClientPort } from './json-http-client';
import { JsonHttpCrudRepositoryImplementation } from './json-http-crud-repository-implementation';

/** Endpoint and schema configuration for one typed JSON/HTTP resource. */
export interface JsonHttpCrudRepositoryOptions<
  TData,
  TCreate,
  TUpdate,
  TFilter,
> {
  readonly client: JsonHttpClientPort;
  readonly baseUrl: string;
  readonly schemas: {
    readonly record: z.ZodType<CrudRecord<TData>>;
    readonly page: z.ZodType<Page<CrudRecord<TData>>>;
  };
  readonly serializeCreate: (input: TCreate) => unknown;
  readonly serializeUpdate: (input: TUpdate) => unknown;
  readonly listUrl: (request: ListRequest<TFilter>) => string;
  readonly recordUrl: (id: string) => string;
}

/** JSON/HTTP CRUD adapter with schema validation at the transport boundary. */
export function createJsonHttpCrudRepository<
  TData,
  TCreate,
  TUpdate,
  TFilter = unknown,
>(
  options: JsonHttpCrudRepositoryOptions<TData, TCreate, TUpdate, TFilter>,
): CrudRepositoryPort<TData, TCreate, TUpdate, TFilter> {
  return new JsonHttpCrudRepositoryImplementation(options);
}
