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
  if (!options.keyPrefix.trim()) {
    throw new TypeError('Cache key prefix must be non-empty');
  }
  if (!Number.isFinite(options.ttlMilliseconds) || options.ttlMilliseconds <= 0) {
    throw new RangeError('Cache TTL must be a positive finite number');
  }
  const stableJson = (value: unknown): string =>
    JSON.stringify(value, (_key, child: unknown) => {
      if (!child || typeof child !== 'object' || Array.isArray(child)) return child;
      return Object.fromEntries(
        Object.entries(child as Record<string, unknown>).sort(([a], [b]) =>
          a.localeCompare(b),
        ),
      );
    });
  const listKey = (request: ListRequest<TFilter>) =>
    `${options.keyPrefix}:list:${stableJson(request)}`;
  const getKey = (request: GetRequest) =>
    `${options.keyPrefix}:get:${request.id}`;

  const invalidate = () => cache.clearNamespace(options.keyPrefix);

  return {
    async list(request, readOptions) {
      const key = listKey(request);
      const cached = (await cache.get(key, readOptions)) as
        | Page<CrudRecord<TData>>
        | undefined;
      if (cached !== undefined) return cached;
      const result = await backing.list(request);
      await cache.set(key, result, options.ttlMilliseconds);
      return result;
    },
    async get(request, readOptions) {
      const key = getKey(request);
      const cached = (await cache.get(key, readOptions)) as
        | CrudRecord<TData>
        | undefined;
      if (cached !== undefined) return cached;
      const result = await backing.get(request);
      if (result !== undefined) {
        await cache.set(key, result, options.ttlMilliseconds);
      }
      return result;
    },
    async create(input) {
      const result = await backing.create(input);
      await invalidate();
      return result;
    },
    async replace(request: RecordCommand, input: TUpdate) {
      const result = await backing.replace(request, input);
      await invalidate();
      return result;
    },
    async markForDeletion(request) {
      const result = await backing.markForDeletion(request);
      await invalidate();
      return result;
    },
    async restore(request) {
      const result = await backing.restore(request);
      await invalidate();
      return result;
    },
    async delete(request) {
      await backing.delete(request);
      await invalidate();
    },
  };
}
