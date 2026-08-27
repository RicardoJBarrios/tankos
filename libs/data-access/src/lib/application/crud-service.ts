import type { CrudRepositoryPort } from '../core';
import type {
  AccessContext,
  CrudRecord,
  CreateRequest,
  GetRequest,
  ListRequest,
  Page,
  RecordCommand,
} from '../core';
import type { CrudOperation, CrudPolicy } from './crud-policy';

const ALL_LIFECYCLE = [
  'active',
  'inactive',
  'marked-for-deletion',
  'deleted',
] as const;

/** Composable application API for one entity's CRUD lifecycle. */
export interface CrudService<TData, TCreate, TUpdate, TFilter = unknown> {
  list(request: ListRequest<TFilter>): Promise<Page<CrudRecord<TData>>>;
  get(request: GetRequest): Promise<CrudRecord<TData> | undefined>;
  create(request: CreateRequest<TCreate>): Promise<CrudRecord<TData>>;
  replace(request: RecordCommand, input: TUpdate): Promise<CrudRecord<TData>>;
  markForDeletion(request: RecordCommand): Promise<CrudRecord<TData>>;
  restore(request: RecordCommand): Promise<CrudRecord<TData>>;
  delete(request: RecordCommand): Promise<void>;
}

/** Composes CRUD use cases around a provider-specific repository port. */
export function createCrudService<TData, TCreate, TUpdate, TFilter = unknown>(
  repository: CrudRepositoryPort<TData, TCreate, TUpdate, TFilter>,
  options: {
    readonly policy?: CrudPolicy<TData, TCreate, TUpdate>;
  } = {},
): CrudService<TData, TCreate, TUpdate, TFilter> {
  const policy = options.policy;
  const current = createCurrentLoader(repository);
  const authorize = createCrudAuthorizer(policy);

  return {
    list: async (request) => {
      await authorize('list', request.access);
      return repository.list(request);
    },
    get: async (request) => {
      const record = await repository.get(request);
      if (record) await authorize('get', request.access, record);
      return record;
    },
    create: async (request) => {
      await authorize('create', request.access, undefined, request.input);
      await policy?.validateCreate?.(request);
      return repository.create(request);
    },
    replace: async (request, input) => {
      const record = await current(request);
      await authorize('replace', request.access, record, input);
      if (record) await policy?.validateUpdate?.(request.access, record, input);
      return repository.replace(request, input);
    },
    markForDeletion: async (request) => {
      const record = await current(request);
      await authorize('markForDeletion', request.access, record);
      return repository.markForDeletion(request);
    },
    restore: async (request) => {
      const record = await current(request);
      await authorize('restore', request.access, record);
      return repository.restore(request);
    },
    delete: async (request) => {
      const record = await current(request);
      await authorize('delete', request.access, record);
      return repository.delete(request);
    },
  };
}

function createCurrentLoader<TData, TCreate, TUpdate, TFilter>(
  repository: CrudRepositoryPort<TData, TCreate, TUpdate, TFilter>,
): (command: RecordCommand) => Promise<CrudRecord<TData> | undefined> {
  return (command) =>
    repository.get({
      access: command.access,
      id: command.id,
      lifecycle: ALL_LIFECYCLE,
    });
}

function createCrudAuthorizer<TData, TCreate, TUpdate>(
  policy: CrudPolicy<TData, TCreate, TUpdate> | undefined,
): (
  operation: CrudOperation,
  access: AccessContext,
  record?: CrudRecord<TData>,
  input?: TCreate | TUpdate,
) => Promise<void> {
  return async (operation, access, record, input) => {
    await policy?.authorize({ operation, access, record, input });
  };
}
