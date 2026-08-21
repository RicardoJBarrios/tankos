import type { z } from 'zod';
import type {
  CreateRequest,
  CrudRecord,
  CrudRepositoryPort,
  GetRequest,
  ListRequest,
  Page,
  RecordCommand,
} from '@tank-os/data-access';
import {
  createAccessContext,
  createDataAccessError,
  createPageRequest,
} from '@tank-os/data-access';
import type { JsonHttpClientPort } from './json-http-client';

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
  const url = (path: string) => `${options.baseUrl}${path}`;
  const parseRecord = (value: unknown) => options.schemas.record.parse(value);
  const parsePage = (value: unknown) => options.schemas.page.parse(value);
  const idempotencyKey = (request: {
    readonly access: { readonly requestId?: string };
  }) => {
    if (!request.access.requestId) {
      throw createDataAccessError(
        'validation',
        'Mutating HTTP commands require AccessContext.requestId',
      );
    }
    return request.access.requestId;
  };

  return {
    async list(request) {
      const access = createAccessContext(request.access);
      createPageRequest(request.page);
      const response = await options.client.request<unknown>({
        method: 'GET',
        url: url(options.listUrl(request)),
        access,
      });
      return parsePage(response);
    },
    async get(request: GetRequest) {
      const access = createAccessContext(request.access);
      const response = await options.client.request<unknown>({
        method: 'GET',
        url: url(options.recordUrl(request.id)),
        access,
      });
      return response === undefined || response === null
        ? undefined
        : parseRecord(response);
    },
    async create(request: CreateRequest<TCreate>) {
      const access = createAccessContext(request.access);
      const response = await options.client.request<unknown>({
        method: 'POST',
        url: url(options.recordUrl('')),
        access,
        idempotencyKey: idempotencyKey(request),
        body: options.serializeCreate(request.input),
      });
      return parseRecord(response);
    },
    async replace(request: RecordCommand, input: TUpdate) {
      const access = createAccessContext(request.access);
      const response = await options.client.request<unknown>({
        method: 'PUT',
        url: url(options.recordUrl(request.id)),
        access,
        idempotencyKey: idempotencyKey(request),
        body: {
          input: options.serializeUpdate(input),
          expectedRevision: request.expectedRevision,
        },
      });
      return parseRecord(response);
    },
    async markForDeletion(request) {
      const access = createAccessContext(request.access);
      const response = await options.client.request<unknown>({
        method: 'POST',
        url: url(`${options.recordUrl(request.id)}/mark-for-deletion`),
        access,
        idempotencyKey: idempotencyKey(request),
        body: { expectedRevision: request.expectedRevision },
      });
      return parseRecord(response);
    },
    async restore(request) {
      const access = createAccessContext(request.access);
      const response = await options.client.request<unknown>({
        method: 'POST',
        url: url(`${options.recordUrl(request.id)}/restore`),
        access,
        idempotencyKey: idempotencyKey(request),
        body: { expectedRevision: request.expectedRevision },
      });
      return parseRecord(response);
    },
    async delete(request) {
      const access = createAccessContext(request.access);
      await options.client.request<unknown>({
        method: 'DELETE',
        url: url(options.recordUrl(request.id)),
        access,
        idempotencyKey: idempotencyKey(request),
        body: { expectedRevision: request.expectedRevision },
      });
    },
  };
}
