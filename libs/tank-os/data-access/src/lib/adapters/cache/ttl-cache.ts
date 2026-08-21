import type { CachePort, CacheReadOptions } from '../../core';

/** Clock dependency used to make TTL behavior deterministic in tests. */
export interface CacheClock {
  now(): number;
}

interface CacheEntry<TValue> {
  readonly value: TValue;
  readonly expiresAt: number;
}

/** In-memory TTL cache with explicit force-refresh and invalidation semantics. */
export function createTtlCache<TValue>(clock: CacheClock): CachePort<TValue> {
  const entries = new Map<string, CacheEntry<TValue>>();

  return {
    get(key: string, options?: CacheReadOptions): TValue | undefined {
      if (options?.forceRefresh) {
        return undefined;
      }

      const entry = entries.get(key);
      if (!entry || entry.expiresAt <= clock.now()) {
        entries.delete(key);
        return undefined;
      }

      return entry.value;
    },
    set(key, value, ttlMilliseconds) {
      if (!Number.isFinite(ttlMilliseconds) || ttlMilliseconds <= 0) {
        throw new RangeError('Cache TTL must be a positive finite number');
      }
      entries.set(key, { value, expiresAt: clock.now() + ttlMilliseconds });
    },
    delete(key) {
      entries.delete(key);
    },
    clear() {
      entries.clear();
    },
  };
}
