import type {
  CachePort,
  CacheReadOptions,
  CrudRecord,
  CrudRepositoryPort,
  GetRequest,
  ListRequest,
  Page,
  CacheScope,
} from '../../core';
import { CachedCrudRepositoryImplementation } from './cached-crud-repository-implementation';

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

/** Configuration for the cache decorator. */
export interface CachedCrudRepositoryOptions {
  readonly ttlMilliseconds: number;
  readonly scope: CacheScope;
  /** Observes cache errors without failing a durable operation. */
  readonly onCacheError?: (error: unknown) => void;
}

/** Creates a cache decorator that invalidates entity reads after mutation. */
export function createCachedCrudRepository<
  TData,
  TCreate,
  TUpdate,
  TFilter = unknown,
>(
  backing: CrudRepositoryPort<TData, TCreate, TUpdate, TFilter>,
  cache: CachePort<unknown>,
  options: CachedCrudRepositoryOptions,
): CachedCrudRepository<TData, TCreate, TUpdate, TFilter> {
  return new CachedCrudRepositoryImplementation(backing, cache, options);
}
