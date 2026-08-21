import { createEntityId } from '../../core';
import type { CrudRecord } from '../../core';
import { createInMemoryCrudRepository } from './memory-crud-repository';

describe('createInMemoryCrudRepository', () => {
  const instant = { kind: 'instant' as const, epochMilliseconds: 0 };
  const initial: CrudRecord<{ name: string }>[] = [
    {
      id: createEntityId('one'),
      data: { name: 'one' },
      lifecycle: { status: 'active' },
      version: 1,
      metadata: { schemaVersion: 1, createdAt: instant, updatedAt: instant },
    },
    {
      id: createEntityId('two'),
      data: { name: 'two' },
      lifecycle: { status: 'active' },
      version: 1,
      metadata: { schemaVersion: 1, createdAt: instant, updatedAt: instant },
    },
    {
      id: createEntityId('deleted'),
      data: { name: 'deleted' },
      lifecycle: { status: 'marked-for-deletion' },
      version: 1,
      metadata: { schemaVersion: 1, createdAt: instant, updatedAt: instant },
    },
  ];

  function repository() {
    return createInMemoryCrudRepository({
      initialRecords: initial,
      now: () => instant,
      create: (input: { name: string }) => ({
        id: createEntityId(input.name),
        data: input,
        lifecycle: { status: 'active' as const },
        version: 1,
        metadata: { schemaVersion: 1, createdAt: instant, updatedAt: instant },
      }),
      update: (_data, input: { name: string }) => input,
      matches: (record, filter: { name?: string }) =>
        filter.name === undefined || record.data.name === filter.name,
    });
  }

  it('Given visible records, When listed, Then excludes deletion-marked records and returns an opaque next cursor', async () => {
    const result = await repository().list({
      page: { pageSize: 1, orderBy: [{ field: 'id', direction: 'asc' }] },
    });
    expect(result.items).toHaveLength(1);
    expect(result.hasMore).toBe(true);
    expect(result.nextCursor).toBeDefined();

    const secondPage = await repository().list({
      page: {
        pageSize: 1,
        after: result.nextCursor,
        orderBy: [{ field: 'id', direction: 'asc' }],
      },
    });
    expect(secondPage.items).toHaveLength(1);
  });

  it('Given an administrative lifecycle filter, When listed, Then includes marked records', async () => {
    const result = await repository().list({
      page: { pageSize: 20, orderBy: [{ field: 'id', direction: 'asc' }] },
      lifecycle: ['active', 'marked-for-deletion'],
    });
    expect(result.items).toHaveLength(3);
  });

  it('Given a malformed in-memory cursor or unmatched filter, When listed, Then rejects or returns an empty page', async () => {
    const service = repository();
    await expect(
      service.list({
        page: {
          pageSize: 20,
          after: 'not-a-number' as never,
          orderBy: [{ field: 'id', direction: 'asc' }],
        },
      }),
    ).rejects.toMatchObject({ code: 'validation' });
    await expect(
      service.list({
        page: { pageSize: 20, orderBy: [{ field: 'id', direction: 'asc' }] },
        filter: { name: 'missing' },
      }),
    ).resolves.toMatchObject({ items: [], hasMore: false });
  });

  it('Given a record, When replaced, marked and restored, Then updates data, version and lifecycle', async () => {
    const service = repository();
    const id = createEntityId('one');
    const replaced = await service.replace({ id }, { name: 'updated' });
    expect(replaced.data.name).toBe('updated');
    expect(replaced.version).toBe(2);
    expect((await service.markForDeletion({ id })).lifecycle.status).toBe(
      'marked-for-deletion',
    );
    expect((await service.restore({ id })).lifecycle.status).toBe('active');
  });

  it('Given a missing record, When modified, Then returns a not-found data-access error', async () => {
    await expect(
      repository().replace({ id: createEntityId('missing') }, { name: 'x' }),
    ).rejects.toMatchObject({ code: 'not-found', retryable: false });
  });

  it('Given an existing record, When created with the same id, Then returns a conflict', async () => {
    await expect(repository().create({ name: 'one' })).rejects.toMatchObject({
      code: 'conflict',
    });
  });

  it('Given a marked record, When physically deleted, Then it is absent and cannot be restored', async () => {
    const service = repository();
    const id = createEntityId('deleted');
    await service.delete({ id });
    await expect(service.restore({ id })).rejects.toMatchObject({
      code: 'not-found',
    });
  });

  it('Given no initial records or filter matcher, When created, Then starts with an empty catalogue', async () => {
    const service = createInMemoryCrudRepository({
      now: () => instant,
      create: (input: { name: string }) => ({
        id: createEntityId(input.name),
        data: input,
        lifecycle: { status: 'active' as const },
        version: 1,
        metadata: { schemaVersion: 1, createdAt: instant, updatedAt: instant },
      }),
      update: (_data: { name: string }, input: { name: string }) => input,
    });

    await expect(
      service.list({
        page: { pageSize: 20, orderBy: [{ field: 'id', direction: 'asc' }] },
      }),
    ).resolves.toMatchObject({ items: [], hasMore: false });
  });
});
