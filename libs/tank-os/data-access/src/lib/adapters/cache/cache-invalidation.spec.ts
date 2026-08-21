import { vi } from 'vitest';
import { createCacheInvalidation } from './cache-invalidation';

describe('createCacheInvalidation', () => {
  it('Given a scope, When cleared, Then removes only its hierarchical namespace', async () => {
    const cache = {
      clearNamespace: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
    };
    const invalidation = createCacheInvalidation(cache);

    await invalidation.clear({ domain: 'units' });

    expect(cache.clearNamespace).toHaveBeenCalledWith('tankos:units');
    expect(cache.clear).not.toHaveBeenCalled();
  });

  it('Given a cache, When all entries are cleared, Then delegates a global reset', async () => {
    const cache = {
      clearNamespace: vi.fn().mockResolvedValue(undefined),
      clear: vi.fn().mockResolvedValue(undefined),
    };

    await createCacheInvalidation(cache).clearAll();

    expect(cache.clear).toHaveBeenCalledOnce();
  });
});
