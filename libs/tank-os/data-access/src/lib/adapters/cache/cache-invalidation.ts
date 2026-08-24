import type { CacheInvalidationPort, CachePort, CacheScope } from '../../core';
import { createCacheNamespace } from '../../core';

/** Creates scoped invalidation over any provider-neutral cache. */
export function createCacheInvalidation(
  cache: Pick<CachePort<unknown>, 'clearNamespace' | 'clear'>,
): CacheInvalidationPort {
  return {
    clear: (scope: CacheScope) =>
      cache.clearNamespace(createCacheNamespace(scope)),
    clearAll: () => cache.clear(),
  };
}
