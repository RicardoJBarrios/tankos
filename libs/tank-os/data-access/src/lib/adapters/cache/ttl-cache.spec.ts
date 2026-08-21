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

  it('Given a cached value within its TTL, When read, Then returns the value', () => {
    const timer = clock();
    const cache = createTtlCache<string>(timer);
    cache.set('units', 'catalogue', 100);

    expect(cache.get('units')).toBe('catalogue');
  });

  it('Given an expired value, When read, Then removes and returns undefined', () => {
    const timer = clock();
    const cache = createTtlCache<string>(timer);
    cache.set('units', 'catalogue', 100);
    timer.advance(100);

    expect(cache.get('units')).toBeUndefined();
    expect(cache.get('units')).toBeUndefined();
  });

  it('Given a present value, When force refresh is requested, Then bypasses it', () => {
    const timer = clock();
    const cache = createTtlCache<string>(timer);
    cache.set('units', 'catalogue', 100);

    expect(cache.get('units', { forceRefresh: true })).toBeUndefined();
    expect(cache.get('units')).toBe('catalogue');
  });

  it('Given a non-positive or non-finite TTL, When stored, Then rejects it', () => {
    const cache = createTtlCache<string>(clock());

    for (const ttl of [0, -1, NaN, Infinity, -Infinity]) {
      expect(() => cache.set('units', 'catalogue', ttl)).toThrow(RangeError);
    }
  });

  it('Given entries, When deleted or cleared, Then they are no longer available', () => {
    const cache = createTtlCache<string>(clock());
    cache.set('one', '1', 100);
    cache.set('two', '2', 100);

    cache.delete('one');
    expect(cache.get('one')).toBeUndefined();
    cache.clear();
    expect(cache.get('two')).toBeUndefined();
  });
});
