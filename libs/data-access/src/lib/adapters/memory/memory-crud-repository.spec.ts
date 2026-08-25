import { createEntityId } from '../../core';
import type { CrudRecord } from '../../core';
import { createInMemoryCrudRepository } from './memory-crud-repository';

describe('createInMemoryCrudRepository', () => {
  const access = {
    principalId: createEntityId('keeper'),
    roles: ['keeper'] as const,
  };
  const administrator = {
    principalId: createEntityId('administrator'),
    roles: ['administrator'] as const,
  };
  const instant = { kind: 'instant' as const, epochMilliseconds: 0 };
  const initial: CrudRecord<{ name: string }>[] = [
    {
      id: createEntityId('one'),
      data: { name: 'one' },
      lifecycle: { status: 'active' },
      revision: 1,
      metadata: { schemaVersion: 1, createdAt: instant, updatedAt: instant },
    },
    {
      id: createEntityId('two'),
      data: { name: 'two' },
      lifecycle: { status: 'active' },
      revision: 1,
      metadata: { schemaVersion: 1, createdAt: instant, updatedAt: instant },
    },
    {
      id: createEntityId('deleted'),
      data: { name: 'deleted' },
      lifecycle: { status: 'marked-for-deletion' },
      revision: 1,
      metadata: { schemaVersion: 1, createdAt: instant, updatedAt: instant },
    },
  ];

  function repository() {
    return createInMemoryCrudRepository({
      initialRecords: initial,
      clock: { now: () => instant },
      create: (input: { name: string }) => ({
        id: createEntityId(input.name),
        data: input,
        lifecycle: { status: 'active' as const },
        revision: 1,
        metadata: { schemaVersion: 1, createdAt: instant, updatedAt: instant },
      }),
      update: (_data, input: { name: string }) => input,
      matches: (record, filter: { name?: string }) =>
        filter.name === undefined || record.data.name === filter.name,
    });
  }

  it('Given visible records, When listed, Then excludes deletion-marked records and returns an opaque next cursor', async () => {
    const result = await repository().list({
      access,
      page: { pageSize: 1, orderBy: [{ field: 'id', direction: 'asc' }] },
    });
    expect(result.items).toHaveLength(1);
    expect(result.hasMore).toBe(true);
    expect(result.nextCursor).toBeDefined();

    const secondPage = await repository().list({
      access,
      page: {
        pageSize: 1,
        after: result.nextCursor,
        orderBy: [{ field: 'id', direction: 'asc' }],
      },
    });
    expect(secondPage.items).toHaveLength(1);
  });

  it('Given an existing record, When fetched, Then returns it only when its lifecycle is visible', async () => {
    const service = repository();

    await expect(
      service.get({ access, id: createEntityId('one') }),
    ).resolves.toMatchObject({
      id: 'one',
    });
    await expect(
      service.get({ access, id: createEntityId('missing') }),
    ).resolves.toBeUndefined();
    await expect(
      service.get({ access, id: createEntityId('deleted') }),
    ).resolves.toBeUndefined();
    await expect(
      service.get({
        access: administrator,
        id: createEntityId('deleted'),
        lifecycle: ['marked-for-deletion'],
      }),
    ).resolves.toMatchObject({ id: 'deleted' });
  });

  it('Given an administrative lifecycle filter, When listed, Then includes marked records', async () => {
    const result = await repository().list({
      access: administrator,
      page: { pageSize: 20, orderBy: [{ field: 'id', direction: 'asc' }] },
      lifecycle: ['active', 'marked-for-deletion'],
    });
    expect(result.items).toHaveLength(3);
  });

  it('Given a malformed in-memory cursor or unmatched filter, When listed, Then rejects or returns an empty page', async () => {
    const service = repository();
    await expect(
      service.list({
        access,
        page: {
          pageSize: 20,
          after: '{' as never,
          orderBy: [{ field: 'id', direction: 'asc' }],
        },
      }),
    ).rejects.toBeInstanceOf(SyntaxError);
    await expect(
      service.list({
        access,
        page: {
          pageSize: 20,
          after: 'null' as never,
          orderBy: [{ field: 'id', direction: 'asc' }],
        },
      }),
    ).rejects.toMatchObject({ code: 'validation' });
    await expect(
      service.list({
        access,
        page: {
          pageSize: 20,
          after: '{}' as never,
          orderBy: [{ field: 'id', direction: 'asc' }],
        },
      }),
    ).rejects.toMatchObject({ code: 'validation' });
    await expect(
      service.list({
        access,
        page: { pageSize: 20, orderBy: [{ field: 'id', direction: 'asc' }] },
        filter: { name: 'missing' },
      }),
    ).resolves.toMatchObject({ items: [], hasMore: false });
    const validPage = await service.list({
      access,
      page: { pageSize: 1, orderBy: [{ field: 'id', direction: 'asc' }] },
    });
    await expect(
      service.list({
        access,
        page: {
          pageSize: 1,
          after: JSON.stringify({
            id: 'unknown',
            orderBy: [{ field: 'id', direction: 'asc' }],
          }),
          orderBy: [{ field: 'id', direction: 'asc' }],
        },
      }),
    ).rejects.toMatchObject({ code: 'validation' });
    await expect(
      service.list({
        access,
        page: {
          pageSize: 1,
          after: validPage.nextCursor,
          orderBy: [{ field: 'name', direction: 'asc' }],
        },
      }),
    ).rejects.toMatchObject({ code: 'validation' });
    await expect(
      service.list({
        access,
        page: {
          pageSize: 1,
          after: JSON.stringify({
            id: 'one',
            orderBy: [{ field: 'id', direction: 'asc' }],
          }),
          orderBy: [{ field: 'id', direction: 'asc' }],
        },
      }),
    ).resolves.toMatchObject({ items: [{ id: 'two' }] });
    await expect(
      service.list({
        access,
        page: {
          pageSize: 20,
          orderBy: [{ field: 'data.name.missing', direction: 'asc' }],
        },
      }),
    ).resolves.toMatchObject({ hasMore: false });
  });

  it('Given a numeric order field, When listed descending, Then applies the requested direction', async () => {
    const result = await createInMemoryCrudRepository({
      initialRecords: initial.map((record, index) => ({
        ...record,
        revision: index + 1,
      })),
      clock: { now: () => instant },
      create: (input: { name: string }) => ({
        id: createEntityId(input.name),
        data: input,
        lifecycle: { status: 'active' as const },
        revision: 1,
        metadata: { schemaVersion: 1, createdAt: instant, updatedAt: instant },
      }),
      update: (_data, input: { name: string }) => input,
    }).list({
      access,
      page: {
        pageSize: 20,
        orderBy: [{ field: 'revision', direction: 'desc' }],
      },
    });
    expect(result.items.map((item) => item.id)).toEqual(['two', 'one']);
  });

  it('Given a textual nested order field, When listed, Then sorts by its value', async () => {
    const result = await repository().list({
      access,
      page: {
        pageSize: 20,
        orderBy: [{ field: 'data.name', direction: 'asc' }],
      },
    });
    expect(result.items.map((item) => item.data.name)).toEqual(['one', 'two']);
  });

  it('Given a numeric nested order field, When listed, Then accepts numeric values', async () => {
    const numericRecords = initial.map((record, index) => ({
      ...record,
      data: { name: index } as unknown as { name: string },
    }));
    const numericRepository = createInMemoryCrudRepository({
      initialRecords: numericRecords,
      clock: { now: () => instant },
      create: (input: { name: string }) => ({
        id: createEntityId(input.name),
        data: input,
        lifecycle: { status: 'active' as const },
        revision: 1,
        metadata: { schemaVersion: 1, createdAt: instant, updatedAt: instant },
      }),
      update: (_data, input: { name: string }) => input,
    });
    const result = await numericRepository.list({
      access,
      page: {
        pageSize: 20,
        orderBy: [{ field: 'data.name', direction: 'desc' }],
      },
    });
    expect(result.items).toHaveLength(2);
  });

  it('Given a record, When replaced, marked and restored, Then updates data, version and lifecycle', async () => {
    const service = repository();
    const id = createEntityId('one');
    const replaced = await service.replace(
      { access, id, expectedRevision: 1 },
      { name: 'updated' },
    );
    expect(replaced.data.name).toBe('updated');
    expect(replaced.revision).toBe(2);
    expect(
      (
        await service.markForDeletion({
          access: administrator,
          id,
          expectedRevision: 2,
        })
      ).lifecycle.status,
    ).toBe('marked-for-deletion');
    expect(
      (
        await service.restore({
          access: administrator,
          id,
          expectedRevision: 3,
        })
      ).lifecycle.status,
    ).toBe('active');
  });

  it('Given a missing record, When modified, Then returns a not-found data-access error', async () => {
    await expect(
      repository().replace(
        { access, id: createEntityId('missing') },
        { name: 'x' },
      ),
    ).rejects.toMatchObject({ code: 'not-found', retryable: false });
  });

  it('Given a stale expected revision, When modified, Then returns a conflict', async () => {
    await expect(
      repository().replace(
        { access, id: createEntityId('one'), expectedRevision: 99 },
        { name: 'x' },
      ),
    ).rejects.toMatchObject({ code: 'conflict' });
  });

  it('Given a command without an integer revision, When modified, Then returns a validation error', async () => {
    await expect(
      repository().replace(
        { access, id: createEntityId('one'), expectedRevision: undefined },
        { name: 'x' },
      ),
    ).rejects.toMatchObject({ code: 'validation' });
  });

  it('Given an active record, When restore is requested, Then returns a lifecycle error', async () => {
    await expect(
      repository().restore({
        access: administrator,
        id: createEntityId('one'),
        expectedRevision: 1,
      }),
    ).rejects.toMatchObject({ code: 'lifecycle' });
  });

  it('Given a marked record, When restore is requested, Then returns it to active lifecycle', async () => {
    const restored = await repository().restore({
      access: administrator,
      id: createEntityId('deleted'),
      expectedRevision: 1,
    });
    expect(restored.lifecycle.status).toBe('active');
  });

  it('Given a terminally deleted record, When it is marked for deletion, Then returns a lifecycle error', async () => {
    const service = createInMemoryCrudRepository({
      initialRecords: initial.map((record) =>
        record.id === createEntityId('deleted')
          ? { ...record, lifecycle: { status: 'deleted' as const } }
          : record,
      ),
      clock: { now: () => instant },
      create: (input: { name: string }) => ({
        id: createEntityId(input.name),
        data: input,
        lifecycle: { status: 'active' as const },
        revision: 1,
        metadata: { schemaVersion: 1, createdAt: instant, updatedAt: instant },
      }),
      update: (_data, input: { name: string }) => input,
    });
    await expect(
      service.markForDeletion({
        access: administrator,
        id: createEntityId('deleted'),
        expectedRevision: 1,
      }),
    ).rejects.toMatchObject({ code: 'lifecycle' });
  });

  it('Given an existing record, When created with the same id, Then returns a conflict', async () => {
    await expect(
      repository().create({ access, input: { name: 'one' } }),
    ).rejects.toMatchObject({
      code: 'conflict',
    });
  });

  it('Given a new record, When created, Then stores and returns it', async () => {
    const result = await repository().create({
      access,
      input: { name: 'three' },
    });

    expect(result).toMatchObject({ id: 'three', data: { name: 'three' } });
  });

  it('Given an active record, When physically deleted without marking, Then returns a lifecycle error', async () => {
    await expect(
      repository().delete({
        access: administrator,
        id: createEntityId('one'),
        expectedRevision: 1,
      }),
    ).rejects.toMatchObject({ code: 'lifecycle' });
  });

  it('Given a marked record, When physically deleted, Then it is absent and cannot be restored', async () => {
    const service = repository();
    const id = createEntityId('deleted');
    await service.delete({ access: administrator, id, expectedRevision: 1 });
    await expect(
      service.restore({ access: administrator, id, expectedRevision: 1 }),
    ).rejects.toMatchObject({
      code: 'not-found',
    });
  });

  it('Given a keeper, When a lifecycle operation is requested, Then returns forbidden', async () => {
    await expect(
      repository().markForDeletion({
        access,
        id: createEntityId('one'),
        expectedRevision: 1,
      }),
    ).rejects.toMatchObject({ code: 'forbidden' });
  });

  it('Given no initial records or filter matcher, When created, Then starts with an empty catalogue', async () => {
    const service = createInMemoryCrudRepository({
      clock: { now: () => instant },
      create: (input: { name: string }) => ({
        id: createEntityId(input.name),
        data: input,
        lifecycle: { status: 'active' as const },
        revision: 1,
        metadata: { schemaVersion: 1, createdAt: instant, updatedAt: instant },
      }),
      update: (_data: { name: string }, input: { name: string }) => input,
    });

    await expect(
      service.list({
        access,
        page: { pageSize: 20, orderBy: [{ field: 'id', direction: 'asc' }] },
      }),
    ).resolves.toMatchObject({ items: [], hasMore: false });
    await expect(
      service.list({
        access,
        page: { pageSize: 20, orderBy: [{ field: 'id', direction: 'asc' }] },
        filter: { name: 'missing' },
      }),
    ).rejects.toMatchObject({ code: 'validation' });
  });
});
