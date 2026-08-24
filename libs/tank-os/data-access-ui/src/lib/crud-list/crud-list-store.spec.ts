import {
  createEntityId,
  createPageCursor,
  type BatchProgress,
  type CrudRecord,
  type CrudService,
} from '@tank-os/data-access';
import { describe, expect, it, vi } from 'vitest';
import { createCrudListStore } from './crud-list-store';

describe('createCrudListStore', () => {
  const access = { principalId: createEntityId('keeper'), roles: ['keeper'] };
  const record: CrudRecord<{ name: string }> = {
    id: createEntityId('one'),
    data: { name: 'One' },
    lifecycle: { status: 'active' },
    revision: 1,
    metadata: {
      schemaVersion: 1,
      createdAt: { kind: 'instant', epochMilliseconds: 0 },
      updatedAt: { kind: 'instant', epochMilliseconds: 0 },
    },
  };
  const service = {
    list: vi.fn(async () => ({ items: [record], hasMore: false })),
    get: vi.fn(),
    create: vi.fn(),
    replace: vi.fn(),
    markForDeletion: vi.fn(async () => record),
    restore: vi.fn(async () => record),
    delete: vi.fn(),
  } as unknown as CrudService<
    { name: string },
    { name: string },
    { name: string },
    { query: string }
  >;

  function createStore() {
    return new (createCrudListStore({
      service,
      schema: 'units',
      page: { pageSize: 10, orderBy: [{ field: 'id', direction: 'asc' }] },
    }))();
  }

  const progress: BatchProgress = {
    batchId: createEntityId('batch-1'),
    schema: 'units',
    operation: 'mark-for-deletion',
    status: 'queued',
    total: 1,
    processed: 0,
    warnings: 0,
    failures: 0,
    createdAt: { kind: 'instant', epochMilliseconds: 0 },
    updatedAt: { kind: 'instant', epochMilliseconds: 0 },
    retryCount: 0,
  };

  it('Given an idle store, When loaded, Then exposes records and ready state', async () => {
    const store = createStore();
    await store.load(access, { query: 'one' });
    expect(store.status()).toBe('ready');
    expect(store.items()).toEqual([record]);
    expect(store.isEmpty()).toBe(false);
  });

  it('Given selected records, When toggled twice, Then selection is reversible', async () => {
    const store = createStore();
    store.toggleSelection(record.id);
    expect(store.selectedIds()).toHaveLength(1);
    store.toggleSelection(record.id);
    expect(store.selectedIds()).toHaveLength(0);
    store.clearSelection();
  });

  it('Given a lifecycle command, When completed, Then refreshes the current filter', async () => {
    const store = createStore();
    await store.load(access, { query: 'one' });
    await store.markForDeletion({ access, id: record.id, expectedRevision: 1 });
    await store.restore({ access, id: record.id, expectedRevision: 1 });
    expect(service.markForDeletion).toHaveBeenCalled();
    expect(service.restore).toHaveBeenCalled();
  });

  it('Given a failed list request, When loaded, Then exposes the error state', async () => {
    const failing = {
      ...service,
      list: vi.fn(async () => {
        throw new Error('offline');
      }),
    } as unknown as typeof service;
    const store = new (createCrudListStore({
      service: failing,
      schema: 'units',
      page: { pageSize: 10, orderBy: [{ field: 'id', direction: 'asc' }] },
    }))();
    expect(store.hasRunningBatch()).toBe(false);
    await store.load(access);
    expect(store.status()).toBe('error');
    expect(store.error()).toBeInstanceOf(Error);
  });

  it('Given a next cursor, When loading more, Then appends the next page', async () => {
    const nextPage = {
      items: [{ ...record, id: createEntityId('two') }],
      hasMore: false,
    };
    service.list
      .mockResolvedValueOnce({
        items: [record],
        hasMore: true,
        nextCursor: createPageCursor('next'),
      })
      .mockResolvedValueOnce(nextPage);
    const store = createStore();
    await store.load(access);
    await store.loadMore(access);
    expect(store.items()).toEqual([record, ...nextPage.items]);
    expect(service.list).toHaveBeenLastCalledWith(
      expect.objectContaining({
        page: expect.objectContaining({ after: createPageCursor('next') }),
      }),
    );
  });

  it('Given no next page, When loading more, Then leaves the list unchanged', async () => {
    const store = createStore();
    await store.load(access);
    await store.loadMore(access);
    expect(store.items()).toEqual([record]);
  });

  it('Given a filter, When changed, Then stores the filter for subsequent commands', () => {
    const store = createStore();
    store.setFilter({ query: 'changed' });
    expect(store.filter()).toEqual({ query: 'changed' });
    store.setFilter(undefined);
    expect(store.filter()).toBeUndefined();
  });

  it('Given a batch capability, When submitted and updated, Then exposes its progress', async () => {
    const batch = { submit: vi.fn(async () => progress) };
    const store = new (createCrudListStore({
      service,
      batch,
      schema: 'units',
      page: { pageSize: 10, orderBy: [{ field: 'id', direction: 'asc' }] },
    }))();
    const result = await store.submitBatch({
      access,
      operation: 'mark-for-deletion',
      confirmationToken: 'confirmed',
      idempotencyKey: 'request-1',
      selection: { kind: 'ids', ids: [record.id] },
    });
    expect(result).toEqual(progress);
    expect(store.hasRunningBatch()).toBe(true);
    store.updateBatch({ ...progress, status: 'materializing' });
    expect(store.hasRunningBatch()).toBe(true);
    store.updateBatch({ ...progress, status: 'running' });
    expect(store.hasRunningBatch()).toBe(true);
    store.updateBatch({ ...progress, status: 'completed' });
    expect(store.batch()?.status).toBe('completed');
  });

  it('Given no batch capability, When submitted, Then rejects with a capability error', async () => {
    const store = createStore();
    await expect(
      store.submitBatch({
        access,
        operation: 'mark-for-deletion',
        confirmationToken: 'confirmed',
        idempotencyKey: 'request-1',
        selection: { kind: 'filter', filter: { query: 'one' } },
      }),
    ).rejects.toThrow('no batch capability');
  });
});
