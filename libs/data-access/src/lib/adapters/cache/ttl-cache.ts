import type { CachePort, CacheReadOptions } from '../../core';

/** Clock dependency used to make TTL behavior deterministic in tests. */
export interface CacheClock {
  now(): number;
}

interface CacheEntry<TValue> {
  readonly value: TValue;
  readonly expiresAt: number;
}

/** In-memory TTL cache with explicit read modes and invalidation semantics. */
export function createTtlCache<TValue>(clock: CacheClock): CachePort<TValue> {
  const entries = new Map<string, CacheEntry<TValue>>();

  return {
    get(
      key: string,
      options?: CacheReadOptions,
    ): Promise<TValue | undefined> {
      if (options?.mode === 'network-only' || options?.mode === 'refresh') {
        return Promise.resolve(undefined);
      }

      const entry = entries.get(key);
      if (!entry || entry.expiresAt <= clock.now()) {
        entries.delete(key);
        return Promise.resolve(undefined);
      }

      return Promise.resolve(entry.value);
    },
    set(key, value, ttlMilliseconds) {
      if (!Number.isFinite(ttlMilliseconds) || ttlMilliseconds <= 0) {
        return Promise.reject(
          new RangeError('Cache TTL must be a positive finite number'),
        );
      }
      entries.set(key, { value, expiresAt: clock.now() + ttlMilliseconds });
      return Promise.resolve();
    },
    delete(key) {
      entries.delete(key);
      return Promise.resolve();
    },
    clearNamespace(namespace) {
      for (const key of entries.keys()) {
        if (key === namespace || key.startsWith(`${namespace}:`)) {
          entries.delete(key);
        }
      }
      return Promise.resolve();
    },
    clear() {
      entries.clear();
      return Promise.resolve();
    },
  };
}
