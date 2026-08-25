import type {
  AccessContext,
  CreateRequest,
  CrudRepositoryPort,
  GetRequest,
  ListRequest,
  RecordCommand,
} from '@tankos/data-access';
import {
  createAccessContext,
  createDataAccessError,
  createPageRequest,
} from '@tankos/data-access';
import type { JsonHttpClientPort } from './json-http-client';
import type { JsonHttpCrudRepositoryOptions } from './json-http-crud-repository';

function validatedAccess(access: AccessContext): AccessContext {
  return createAccessContext(access);
}

function requireIdempotencyKey(access: AccessContext): string {
  if (!access.requestId)
    throw createDataAccessError(
      'validation',
      'Mutating HTTP commands require AccessContext.requestId',
    );
  return access.requestId;
}

function requireExpectedRevision(request: RecordCommand): number {
  if (!Number.isInteger(request.expectedRevision))
    throw createDataAccessError(
      'validation',
      'Record commands require an integer expectedRevision',
    );
  return request.expectedRevision;
}

/** Stateful implementation behind the JSON/HTTP CRUD factory. */
export class JsonHttpCrudRepositoryImplementation<
  TData,
  TCreate,
  TUpdate,
  TFilter,
> implements CrudRepositoryPort<TData, TCreate, TUpdate, TFilter> {
  readonly #options: JsonHttpCrudRepositoryOptions<
    TData,
    TCreate,
    TUpdate,
    TFilter
  >;

  constructor(
    options: JsonHttpCrudRepositoryOptions<TData, TCreate, TUpdate, TFilter>,
  ) {
    this.#options = options;
  }

  async list(request: ListRequest<TFilter>) {
    const access = validatedAccess(request.access);
    createPageRequest(request.page);
    const response = await this.#request({
      method: 'GET',
      url: this.#url(this.#options.listUrl(request)),
      access,
    });
    return this.#options.schemas.page.parse(response);
  }

  async get(request: GetRequest) {
    const response = await this.#request({
      method: 'GET',
      url: this.#url(this.#options.recordUrl(request.id)),
      access: validatedAccess(request.access),
    });
    return response === undefined || response === null
      ? undefined
      : this.#options.schemas.record.parse(response);
  }

  async create(request: CreateRequest<TCreate>) {
    const response = await this.#request({
      method: 'POST',
      url: this.#url(this.#options.recordUrl('')),
      access: validatedAccess(request.access),
      idempotencyKey: requireIdempotencyKey(request.access),
      body: this.#options.serializeCreate(request.input),
    });
    return this.#options.schemas.record.parse(response);
  }

  async replace(request: RecordCommand, input: TUpdate) {
    const response = await this.#request({
      method: 'PUT',
      url: this.#url(this.#options.recordUrl(request.id)),
      access: validatedAccess(request.access),
      idempotencyKey: requireIdempotencyKey(request.access),
      body: {
        input: this.#options.serializeUpdate(input),
        expectedRevision: requireExpectedRevision(request),
      },
    });
    return this.#options.schemas.record.parse(response);
  }

  async markForDeletion(request: RecordCommand) {
    return this.#lifecycleCommand(request, 'mark-for-deletion');
  }

  async restore(request: RecordCommand) {
    return this.#lifecycleCommand(request, 'restore');
  }

  async delete(request: RecordCommand): Promise<void> {
    await this.#request({
      method: 'DELETE',
      url: this.#url(this.#options.recordUrl(request.id)),
      access: validatedAccess(request.access),
      idempotencyKey: requireIdempotencyKey(request.access),
      body: { expectedRevision: requireExpectedRevision(request) },
    });
  }

  #url(path: string): string {
    return `${this.#options.baseUrl}${path}`;
  }

  async #request(
    request: Parameters<JsonHttpClientPort['request']>[0],
  ): Promise<unknown> {
    return this.#options.client.request(request);
  }

  async #lifecycleCommand(
    request: RecordCommand,
    action: 'mark-for-deletion' | 'restore',
  ) {
    const response = await this.#request({
      method: 'POST',
      url: this.#url(`${this.#options.recordUrl(request.id)}/${action}`),
      access: validatedAccess(request.access),
      idempotencyKey: requireIdempotencyKey(request.access),
      body: { expectedRevision: requireExpectedRevision(request) },
    });
    return this.#options.schemas.record.parse(response);
  }
}
