/** Explicit read policy for one cached data-access operation. */
export type CacheReadMode = 'cache-first' | 'network-only' | 'refresh';

/** Optional read controls for a cached data-access operation. */
export interface CacheReadOptions {
  /** Defaults to `cache-first`. */
  readonly mode?: CacheReadMode;
}

/** Provider-neutral cache port used by TTL decorators. */
export interface CachePort<TValue> {
  get(key: string, options?: CacheReadOptions): Promise<TValue | undefined>;
  set(key: string, value: TValue, ttlMilliseconds: number): Promise<void>;
  delete(key: string): Promise<void>;
  /** Removes one namespace and all descendant scopes below it. */
  clearNamespace(namespace: string): Promise<void>;
  clear(): Promise<void>;
}

/** Application-level invalidation contract independent of a storage provider. */
export interface CacheInvalidationPort {
  /** Clears a domain or a more specific scope. */
  clear(scope: import('../value-types').CacheScope): Promise<void>;
  /** Clears every cached value for the current application instance. */
  clearAll(): Promise<void>;
}
