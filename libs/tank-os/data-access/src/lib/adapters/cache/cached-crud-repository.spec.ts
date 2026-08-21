import type { CrudRepositoryPort } from '../../core';
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
      keyPrefix: 'units',
      ttlMilliseconds: 100,
    });
    const request = {
      access,
      page: { pageSize: 20, orderBy: [{ field: 'id', direction: 'asc' as const }] },
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
      { keyPrefix: 'units', ttlMilliseconds: 100 },
    );
    const request = {
      access,
      page: { pageSize: 20, orderBy: [{ field: 'id', direction: 'asc' as const }] },
    };

    await repository.list(request);
    await repository.list(request, { forceRefresh: true });
    expect(reads).toBe(2);
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
      { keyPrefix: 'units', ttlMilliseconds: 100 },
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
      { keyPrefix: 'units', ttlMilliseconds: 100 },
    );
    const request = {
      access,
      page: { pageSize: 20, orderBy: [{ field: 'id', direction: 'asc' as const }] },
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
        return reads === 1 ? record : undefined;
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
      { keyPrefix: 'units', ttlMilliseconds: 100 },
    );

    await repository.get({ access, id: 'one' as never });
    await repository.get({ access, id: 'one' as never });
    expect(reads).toBe(1);
    await repository.get({ access, id: 'missing' as never });
    await repository.get({ access, id: 'missing' as never });
    expect(reads).toBe(3);
  });

  it('Given cached entity reads, When every mutation succeeds, Then invalidates after each mutation', async () => {
    const calls: string[] = [];
    const backing = {
      list: async () => ({ items: [], hasMore: false }),
      get: async () => undefined,
      create: async () => { calls.push('create'); return undefined; },
      replace: async () => { calls.push('replace'); return undefined; },
      markForDeletion: async () => { calls.push('mark'); return undefined; },
      restore: async () => { calls.push('restore'); return undefined; },
      delete: async () => { calls.push('delete'); },
    } as unknown as CrudRepositoryPort<unknown, unknown, unknown>;
    const repository = createCachedCrudRepository(
      backing,
      createTtlCache({ now: () => 0 }),
      { keyPrefix: 'units', ttlMilliseconds: 100 },
    );

    await repository.create({});
    await repository.replace({ access, id: 'one' as never }, {});
    await repository.markForDeletion({ access, id: 'one' as never });
    await repository.restore({ access, id: 'one' as never });
    await repository.delete({ access, id: 'one' as never });
    expect(calls).toEqual(['create', 'replace', 'mark', 'restore', 'delete']);
  });
});
