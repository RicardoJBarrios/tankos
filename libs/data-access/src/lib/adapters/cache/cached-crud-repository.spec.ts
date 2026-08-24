import type { CrudRepositoryPort } from '../../core';
import { vi } from 'vitest';
import { createCachedCrudRepository } from './cached-crud-repository';
import { createTtlCache } from './ttl-cache';

describe('createCachedCrudRepository', () => {
  const access = { principalId: 'keeper' as never, roles: ['keeper'] as const };
  it('Given a backing repository, When a query repeats, Then serves the second read from cache', async () => {
    let reads = 0;
    const page = { items: [], hasMore: false };
    const backing = {
      list: async () => {
        reads += 1;
        return page;
      },
      get: async () => undefined,
      create: async () => undefined,
      replace: async () => undefined,
      markForDeletion: async () => undefined,
      restore: async () => undefined,
      delete: async () => undefined,
    } as unknown as CrudRepositoryPort<unknown, unknown, unknown>;
    const cache = createTtlCache({ now: () => 0 });
    const repository = createCachedCrudRepository(backing, cache, {
      scope: { domain: 'units' },
      ttlMilliseconds: 100,
    });
    const request = {
      access,
      page: {
        pageSize: 20,
        orderBy: [{ field: 'id', direction: 'asc' as const }],
      },
    };

    await repository.list(request);
    await repository.list(request);
    expect(reads).toBe(1);
  });

  it('Given a cached query, When force refresh is requested, Then reads the backing repository again', async () => {
    let reads = 0;
    const backing = {
      list: async () => {
        reads += 1;
        return { items: [], hasMore: false };
      },
      get: async () => undefined,
      create: async () => undefined,
      replace: async () => undefined,
      markForDeletion: async () => undefined,
      restore: async () => undefined,
      delete: async () => undefined,
    } as unknown as CrudRepositoryPort<unknown, unknown, unknown>;
    const repository = createCachedCrudRepository(
      backing,
      createTtlCache({ now: () => 0 }),
      { scope: { domain: 'units' }, ttlMilliseconds: 100 },
    );
    const request = {
      access,
      page: {
        pageSize: 20,
        orderBy: [{ field: 'id', direction: 'asc' as const }],
      },
    };

    await repository.list(request);
    await repository.list(request, { mode: 'network-only' });
    expect(reads).toBe(2);
  });

  it('Given a provider that returns a cached value for every mode, When refresh is requested, Then bypasses cache-first short circuit', async () => {
    let reads = 0;
    const page = { items: [], hasMore: false };
    const backing = {
      list: async () => {
        reads += 1;
        return page;
      },
    } as unknown as CrudRepositoryPort<unknown, unknown, unknown>;
    const cache = {
      get: async () => page,
      set: async () => undefined,
      delete: async () => undefined,
      clearNamespace: async () => undefined,
      clear: async () => undefined,
    };
    const repository = createCachedCrudRepository(backing, cache, {
      scope: { domain: 'units' },
      ttlMilliseconds: 100,
    });

    await expect(
      repository.list(
        {
          access,
          page: {
            pageSize: 20,
            orderBy: [{ field: 'id', direction: 'asc' }],
          },
        },
        { mode: 'refresh' },
      ),
    ).resolves.toEqual(page);
    expect(reads).toBe(1);
  });

  it('Given equivalent requests with different property order, When read, Then uses one stable cache key', async () => {
    let reads = 0;
    const backing = {
      list: async () => {
        reads += 1;
        return { items: [], hasMore: false };
      },
    } as unknown as CrudRepositoryPort<unknown, unknown, unknown>;
    const repository = createCachedCrudRepository(
      backing,
      createTtlCache({ now: () => 0 }),
      { scope: { domain: 'units' }, ttlMilliseconds: 100 },
    );

    await repository.list({
      access,
      page: { pageSize: 20, orderBy: [{ field: 'id', direction: 'asc' }] },
      filter: { first: 'one', second: 'two' },
    });
    await repository.list({
      page: { orderBy: [{ direction: 'asc', field: 'id' }], pageSize: 20 },
      filter: { second: 'two', first: 'one' },
      access,
    });
    expect(reads).toBe(1);
  });

  it('Given cached reads, When a mutation succeeds, Then invalidates all cached entity reads', async () => {
    let reads = 0;
    const page = { items: [], hasMore: false };
    const backing = {
      list: async () => {
        reads += 1;
        return page;
      },
      get: async () => undefined,
      create: async () => undefined,
      replace: async () => undefined,
      markForDeletion: async () => undefined,
      restore: async () => undefined,
      delete: async () => undefined,
    } as unknown as CrudRepositoryPort<unknown, unknown, unknown>;
    const repository = createCachedCrudRepository(
      backing,
      createTtlCache({ now: () => 0 }),
      { scope: { domain: 'units' }, ttlMilliseconds: 100 },
    );
    const request = {
      access,
      page: {
        pageSize: 20,
        orderBy: [{ field: 'id', direction: 'asc' as const }],
      },
    };

    await repository.list(request);
    await repository.create({});
    await repository.list(request);
    expect(reads).toBe(2);
  });

  it('Given a backing record, When it is read twice, Then caches the record and does not cache a missing result', async () => {
    let reads = 0;
    const record = {
      id: 'one' as never,
      data: { name: 'one' },
      lifecycle: { status: 'active' as const },
      revision: 1,
      metadata: {
        schemaVersion: 1,
        createdAt: { kind: 'instant' as const, epochMilliseconds: 0 },
        updatedAt: { kind: 'instant' as const, epochMilliseconds: 0 },
      },
    };
    const backing = {
      list: async () => ({ items: [], hasMore: false }),
      get: async () => {
        reads += 1;
        return reads <= 2 ? record : undefined;
      },
      create: async () => undefined,
      replace: async () => undefined,
      markForDeletion: async () => undefined,
      restore: async () => undefined,
      delete: async () => undefined,
    } as unknown as CrudRepositoryPort<unknown, unknown, unknown>;
    const repository = createCachedCrudRepository(
      backing,
      createTtlCache({ now: () => 0 }),
      { scope: { domain: 'units' }, ttlMilliseconds: 100 },
    );

    await repository.get({ access, id: 'one' as never });
    await repository.get({ access, id: 'one' as never });
    await repository.get({ access, id: 'one' as never }, { mode: 'refresh' });
    expect(reads).toBe(2);
    await repository.get({ access, id: 'missing' as never });
    await repository.get({ access, id: 'missing' as never });
    expect(reads).toBe(4);
  });

  it('Given cached entity reads, When every mutation succeeds, Then invalidates after each mutation', async () => {
    const calls: string[] = [];
    const backing = {
      list: async () => ({ items: [], hasMore: false }),
      get: async () => undefined,
      create: async () => {
        calls.push('create');
        return undefined;
      },
      replace: async () => {
        calls.push('replace');
        return undefined;
      },
      markForDeletion: async () => {
        calls.push('mark');
        return undefined;
      },
      restore: async () => {
        calls.push('restore');
        return undefined;
      },
      delete: async () => {
        calls.push('delete');
      },
    } as unknown as CrudRepositoryPort<unknown, unknown, unknown>;
    const repository = createCachedCrudRepository(
      backing,
      createTtlCache({ now: () => 0 }),
      { scope: { domain: 'units' }, ttlMilliseconds: 100 },
    );

    await repository.create({});
    await repository.replace({ access, id: 'one' as never }, {});
    await repository.markForDeletion({ access, id: 'one' as never });
    await repository.restore({ access, id: 'one' as never });
    await repository.delete({ access, id: 'one' as never });
    expect(calls).toEqual(['create', 'replace', 'mark', 'restore', 'delete']);
  });

  it('Given a cache invalidation failure, When a mutation succeeds, Then preserves the mutation result and reports the cache error', async () => {
    const cacheError = new Error('cache unavailable');
    const onCacheError = vi.fn();
    const backing = {
      list: async () => ({ items: [], hasMore: false }),
      get: async () => undefined,
      create: async () => undefined,
      replace: async () => undefined,
      markForDeletion: async () => undefined,
      restore: async () => undefined,
      delete: async () => undefined,
    } as unknown as CrudRepositoryPort<unknown, unknown, unknown>;
    const cache = {
      get: async () => undefined,
      set: async () => undefined,
      delete: async () => undefined,
      clearNamespace: async () => {
        throw cacheError;
      },
      clear: async () => undefined,
    };
    const repository = createCachedCrudRepository(backing, cache, {
      scope: { domain: 'units' },
      ttlMilliseconds: 100,
      onCacheError,
    });

    await expect(repository.create({})).resolves.toBeUndefined();
    expect(onCacheError).toHaveBeenCalledWith(cacheError);
  });

  it('Given a cache read or write failure, When a read is requested, Then falls back to the backing repository and reports it', async () => {
    const cacheError = new Error('cache unavailable');
    const errors: unknown[] = [];
    let reads = 0;
    const backing = {
      list: async () => {
        reads += 1;
        return { items: [], hasMore: false };
      },
      get: async () => ({
        id: 'one' as never,
        data: {},
        lifecycle: { status: 'active' },
        revision: 1,
        metadata: {
          schemaVersion: 1,
          createdAt: { kind: 'instant' as const, epochMilliseconds: 0 },
          updatedAt: { kind: 'instant' as const, epochMilliseconds: 0 },
        },
      }),
    } as unknown as CrudRepositoryPort<unknown, unknown, unknown>;
    const cache = {
      get: vi.fn().mockRejectedValue(cacheError),
      set: vi.fn().mockRejectedValue(cacheError),
      delete: async () => undefined,
      clearNamespace: async () => undefined,
      clear: async () => undefined,
    };
    const repository = createCachedCrudRepository(backing, cache, {
      scope: { domain: 'units' },
      ttlMilliseconds: 100,
      onCacheError: (error) => errors.push(error),
    });

    await repository.list({ access, page: { pageSize: 20, orderBy: [] } });
    await repository.get({ access, id: 'one' as never });

    expect(reads).toBe(1);
    expect(cache.get).toHaveBeenCalledTimes(2);
    expect(cache.set).toHaveBeenCalledTimes(2);
    expect(errors).toHaveLength(4);

    const withoutObserver = createCachedCrudRepository(backing, cache, {
      scope: { domain: 'units-without-observer' },
      ttlMilliseconds: 100,
    });
    await withoutObserver.get({ access, id: 'one' as never });
  });

  it('Given a read that overlaps invalidation, When the backing result arrives, Then does not repopulate stale cache', async () => {
    let resolveRead!: (value: { items: never[]; hasMore: false }) => void;
    let reads = 0;
    const cache = createTtlCache({ now: () => 0 });
    const backing = {
      list: vi.fn(() => {
        reads += 1;
        if (reads > 1) return Promise.resolve({ items: [], hasMore: false });
        return new Promise<{ items: never[]; hasMore: false }>((resolve) => {
          resolveRead = resolve;
        });
      }),
      create: async () => undefined,
    } as unknown as CrudRepositoryPort<unknown, unknown, unknown>;
    const repository = createCachedCrudRepository(backing, cache, {
      scope: { domain: 'units' },
      ttlMilliseconds: 100,
    });
    const request = { access, page: { pageSize: 20, orderBy: [] } };

    const pending = repository.list(request);
    await Promise.resolve();
    await repository.create({});
    resolveRead({ items: [], hasMore: false });
    await pending;
    await repository.list(request);

    expect(backing.list).toHaveBeenCalledTimes(2);
  });

  it('Given two concurrent identical reads, When both complete, Then calls the backing repository once', async () => {
    let resolveRead!: (value: { items: never[]; hasMore: false }) => void;
    const backing = {
      list: vi.fn(
        () =>
          new Promise<{ items: never[]; hasMore: false }>((resolve) => {
            resolveRead = resolve;
          }),
      ),
    } as unknown as CrudRepositoryPort<unknown, unknown, unknown>;
    const repository = createCachedCrudRepository(
      backing,
      createTtlCache({ now: () => 0 }),
      { scope: { domain: 'units' }, ttlMilliseconds: 100 },
    );
    const request = {
      access,
      page: {
        pageSize: 20,
        orderBy: [{ field: 'id', direction: 'asc' as const }],
      },
    };

    const first = repository.list(request);
    const second = repository.list(request);
    await Promise.resolve();
    resolveRead({ items: [], hasMore: false });

    await expect(Promise.all([first, second])).resolves.toEqual([
      { items: [], hasMore: false },
      { items: [], hasMore: false },
    ]);
    expect(backing.list).toHaveBeenCalledOnce();
  });

  it('Given a scoped repository, When a mutation succeeds, Then invalidates its scoped namespace', async () => {
    const cache = createTtlCache({ now: () => 0 });
    const backing = {
      list: vi.fn(async () => ({ items: [], hasMore: false })),
      get: async () => undefined,
      create: async () => undefined,
      replace: async () => undefined,
      markForDeletion: async () => undefined,
      restore: async () => undefined,
      delete: async () => undefined,
    } as unknown as CrudRepositoryPort<unknown, unknown, unknown>;
    const repository = createCachedCrudRepository(backing, cache, {
      scope: {
        domain: 'measurements',
        principalId: 'user-1',
        aquariumId: 'aquarium-1',
      },
      ttlMilliseconds: 100,
    });
    const request = {
      access,
      page: {
        pageSize: 20,
        orderBy: [{ field: 'id', direction: 'asc' as const }],
      },
    };

    await repository.list(request);
    await repository.create({});
    await repository.list(request);

    expect(backing.list).toHaveBeenCalledTimes(2);
  });
});
