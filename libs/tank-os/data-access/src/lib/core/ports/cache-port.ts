/** Optional read controls for a cached data-access operation. */
export interface CacheReadOptions {
  /** Bypass a present entry and force the backing adapter to be queried. */
  readonly forceRefresh?: boolean;
}

/** Provider-neutral cache port used by TTL decorators. */
export interface CachePort<TValue> {
  get(key: string, options?: CacheReadOptions): Promise<TValue | undefined>;
  set(key: string, value: TValue, ttlMilliseconds: number): Promise<void>;
  delete(key: string): Promise<void>;
  /** Removes every key belonging to one cache namespace. */
  clearNamespace(namespace: string): Promise<void>;
  clear(): Promise<void>;
}
