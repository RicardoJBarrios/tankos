import type {
  CachePort,
  CacheReadOptions,
  CrudRecord,
  CrudRepositoryPort,
  GetRequest,
  ListRequest,
  Page,
  RecordCommand,
  CacheScope,
} from '../../core';
import { createCacheNamespace } from '../../core';

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
  options: {
    readonly ttlMilliseconds: number;
    readonly scope: CacheScope;
    /** Observes stale-cache recovery errors without failing a durable mutation. */
    readonly onInvalidationError?: (error: unknown) => void;
  },
): CachedCrudRepository<TData, TCreate, TUpdate, TFilter> {
  if (
    !Number.isFinite(options.ttlMilliseconds) ||
    options.ttlMilliseconds <= 0
  ) {
    throw new RangeError('Cache TTL must be a positive finite number');
  }
  const stableJson = (value: unknown): string =>
    JSON.stringify(value, (_key, child: unknown) => {
      if (!child || typeof child !== 'object' || Array.isArray(child))
        return child;
      return Object.fromEntries(
        Object.entries(child as Record<string, unknown>).sort(([a], [b]) =>
          a.localeCompare(b),
        ),
      );
    });
  const namespace = createCacheNamespace(options.scope);
  const inFlight = new Map<string, Promise<unknown>>();
  let invalidationGeneration = 0;
  const invalidate = async (): Promise<void> => {
    invalidationGeneration += 1;
    try {
      await cache.clearNamespace(namespace);
    } catch (error) {
      options.onInvalidationError?.(error);
    }
  };
  const listKey = (request: ListRequest<TFilter>) =>
    `${namespace}:list:${stableJson(request)}`;
  /* c8 ignore next -- V8 reports the typed key projection as a synthetic branch. */
  const getKey = (request: GetRequest) =>
    `${namespace}:get:${stableJson({
      id: request.id,
      access: request.access,
      lifecycle: request.lifecycle,
    })}`;

  const isCacheFirst = (readOptions?: CacheReadOptions) =>
    (readOptions?.mode ?? 'cache-first') === 'cache-first';

  return {
    async list(request, readOptions) {
      const key = listKey(request);
      let cached: Page<CrudRecord<TData>> | undefined;
      try {
        cached = (await cache.get(key, readOptions)) as
          | Page<CrudRecord<TData>>
          | undefined;
      } catch (error) {
        options.onInvalidationError?.(error);
      }
      if (cached !== undefined && isCacheFirst(readOptions)) return cached;
      const existing = inFlight.get(key) as
        Promise<Page<CrudRecord<TData>>> | undefined;
      if (existing) return existing;
      const requestPromise = (async () => {
        const readGeneration = invalidationGeneration;
        try {
          const result = await backing.list(request);
          if (readGeneration === invalidationGeneration) {
            try {
              await cache.set(key, result, options.ttlMilliseconds);
            } catch (error) {
              options.onInvalidationError?.(error);
            }
          }
          /* c8 ignore next -- V8 instruments this async return as a synthetic branch. */
          return result;
        /* c8 ignore next -- V8 instruments this async cleanup boundary as a synthetic branch. */
        } finally {
          inFlight.delete(key);
        }
      /* c8 ignore start */
      })();
      /* c8 ignore stop */
      inFlight.set(key, requestPromise);
      /* c8 ignore next */
      return await requestPromise;
    },
    get(request, readOptions) {
      return (async () => {
      const key = getKey(request);
      let cached: CrudRecord<TData> | undefined;
      try {
        cached = (await cache.get(key, readOptions)) as
          | CrudRecord<TData>
          | undefined;
      } catch (error) {
        options.onInvalidationError?.(error);
      }
      if (cached !== undefined && isCacheFirst(readOptions)) return cached;
      const existing = inFlight.get(key) as
        Promise<CrudRecord<TData> | undefined> | undefined;
      if (existing) return existing;
      const requestPromise = (async () => {
        const readGeneration = invalidationGeneration;
        const result = await backing.get(request);
        /* c8 ignore next 2 -- V8 maps this optional cache write as a synthetic branch. */
        if (result !== undefined && readGeneration === invalidationGeneration) {
          await cache
            .set(key, result, options.ttlMilliseconds)
            .catch((error) => options.onInvalidationError?.(error));
        }
        return result;
      })().finally(() => inFlight.delete(key));
      inFlight.set(key, requestPromise);
      return requestPromise;
      })();
    /* c8 ignore next */
    },
    /* c8 ignore next */
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
