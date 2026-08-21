import type {
  CachePort,
  CacheReadOptions,
  CrudRecord,
  CrudRepositoryPort,
  GetRequest,
  ListRequest,
  Page,
  RecordCommand,
} from '../../core';

/** CRUD repository with read-through TTL caching and mutation invalidation. */
export interface CachedCrudRepository<
  TData,
  TCreate,
  TUpdate,
  TFilter = unknown,
> extends CrudRepositoryPort<TData, TCreate, TUpdate, TFilter> {
  list(
    request: ListRequest<TFilter>,
    options?: CacheReadOptions,
  ): Promise<Page<CrudRecord<TData>>>;
  get(
    request: GetRequest,
    options?: CacheReadOptions,
  ): Promise<CrudRecord<TData> | undefined>;
}

/** Creates a cache decorator that invalidates all entity reads after mutation. */
export function createCachedCrudRepository<
  TData,
  TCreate,
  TUpdate,
  TFilter = unknown,
>(
  backing: CrudRepositoryPort<TData, TCreate, TUpdate, TFilter>,
  cache: CachePort<unknown>,
  options: { readonly ttlMilliseconds: number; readonly keyPrefix: string },
): CachedCrudRepository<TData, TCreate, TUpdate, TFilter> {
  const listKey = (request: ListRequest<TFilter>) =>
    `${options.keyPrefix}:list:${JSON.stringify(request)}`;
  const getKey = (request: GetRequest) =>
    `${options.keyPrefix}:get:${request.id}`;

  const invalidate = () => cache.clear();

  return {
    async list(request, readOptions) {
      const key = listKey(request);
      const cached = cache.get(key, readOptions) as
        | Page<CrudRecord<TData>>
        | undefined;
      if (cached !== undefined) return cached;
      const result = await backing.list(request);
      cache.set(key, result, options.ttlMilliseconds);
      return result;
    },
    async get(request, readOptions) {
      const key = getKey(request);
      const cached = cache.get(key, readOptions) as
        | CrudRecord<TData>
        | undefined;
      if (cached !== undefined) return cached;
      const result = await backing.get(request);
      if (result !== undefined) cache.set(key, result, options.ttlMilliseconds);
      return result;
    },
    async create(input) {
      const result = await backing.create(input);
      invalidate();
      return result;
    },
    async replace(request: RecordCommand, input: TUpdate) {
      const result = await backing.replace(request, input);
      invalidate();
      return result;
    },
    async markForDeletion(request) {
      const result = await backing.markForDeletion(request);
      invalidate();
      return result;
    },
    async restore(request) {
      const result = await backing.restore(request);
      invalidate();
      return result;
    },
    async delete(request) {
      await backing.delete(request);
      invalidate();
    },
  };
}
