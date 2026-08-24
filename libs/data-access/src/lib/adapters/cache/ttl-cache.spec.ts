import { createTtlCache, type CacheClock } from './ttl-cache';

describe('createTtlCache', () => {
  function clock(): CacheClock & { advance(milliseconds: number): void } {
    let current = 1000;
    return {
      now: () => current,
      advance: (milliseconds) => {
        current += milliseconds;
      },
    };
  }

  it('Given a cached value within its TTL, When read, Then returns the value', async () => {
    const timer = clock();
    const cache = createTtlCache<string>(timer);
    await cache.set('units', 'catalogue', 100);

    await expect(cache.get('units')).resolves.toBe('catalogue');
  });

  it('Given an expired value, When read, Then removes and returns undefined', async () => {
    const timer = clock();
    const cache = createTtlCache<string>(timer);
    await cache.set('units', 'catalogue', 100);
    timer.advance(100);

    await expect(cache.get('units')).resolves.toBeUndefined();
    await expect(cache.get('units')).resolves.toBeUndefined();
  });

  it('Given a present value, When force refresh is requested, Then bypasses it', async () => {
    const timer = clock();
    const cache = createTtlCache<string>(timer);
    await cache.set('units', 'catalogue', 100);

    for (const mode of ['network-only', 'refresh'] as const) {
      await expect(cache.get('units', { mode })).resolves.toBeUndefined();
    }
    await expect(cache.get('units')).resolves.toBe('catalogue');
  });

  it('Given a non-positive or non-finite TTL, When stored, Then rejects it', async () => {
    const cache = createTtlCache<string>(clock());

    for (const ttl of [0, -1, NaN, Infinity, -Infinity]) {
      await expect(cache.set('units', 'catalogue', ttl)).rejects.toThrow(
        RangeError,
      );
    }
  });

  it('Given entries, When deleted or cleared, Then they are no longer available', async () => {
    const cache = createTtlCache<string>(clock());
    await cache.set('one', '1', 100);
    await cache.set('two', '2', 100);

    await cache.delete('one');
    await expect(cache.get('one')).resolves.toBeUndefined();
    await cache.clear();
    await expect(cache.get('two')).resolves.toBeUndefined();
  });

  it('Given entries in multiple namespaces, When one namespace is cleared, Then unrelated entries remain', async () => {
    const cache = createTtlCache<string>(clock());
    await cache.set('units:list:a', 'units', 100);
    await cache.set('units:get:a', 'unit', 100);
    await cache.set('parameters:list:a', 'parameters', 100);

    await cache.clearNamespace('units');

    await expect(cache.get('units:list:a')).resolves.toBeUndefined();
    await expect(cache.get('units:get:a')).resolves.toBeUndefined();
    await expect(cache.get('parameters:list:a')).resolves.toBe('parameters');
  });
});
