import { z } from 'zod';
import { describe, expect, it, vi } from 'vitest';
import { createEntityId } from '@tank-os/data-access';
import {
  createFirestoreCrudRepository,
  type FirestoreRecordDto,
} from './firestore-crud-repository';

const firestoreMocks = vi.hoisted(() => ({
  collection: vi.fn(() => ({})),
  doc: vi.fn((_firestore, _collection, id) => ({ id })),
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(() => ({})),
  limit: vi.fn((value) => value),
  setDoc: vi.fn(),
  runTransaction: vi.fn(),
  serverTimestamp: vi.fn(() => ({ serverTimestamp: true })),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
}));

vi.mock('firebase/firestore', () => firestoreMocks);

describe('createFirestoreCrudRepository', () => {
  const instant = { toMillis: () => 0 };
  const dto: FirestoreRecordDto<{ name: string }> = {
    data: { name: 'litre' },
    lifecycle: { status: 'active' },
    revision: 1,
    metadata: {
      schemaVersion: 1,
      createdAt: instant as never,
      updatedAt: instant as never,
    },
  };
  const snapshot = (
    exists: boolean,
    id = 'unit-1',
    value: FirestoreRecordDto<{ name: string }> = dto,
  ) => ({
    exists: () => exists,
    id,
    data: () => value,
  });
  const access = {
    principalId: createEntityId('keeper'),
    roles: ['keeper'] as const,
  };
  const schema = z.any() as z.ZodType<FirestoreRecordDto<{ name: string }>>;

  function repository() {
    return createFirestoreCrudRepository({
      firestore: {} as never,
      collectionPath: 'units',
      recordSchema: schema,
      createId: (input: { name: string }) => input.name,
      createData: (input: { name: string }) => input,
      updateData: (_data, input: { name: string }) => input,
      buildQuery: () => ({}) as never,
      encodeCursor: () => 'cursor' as never,
    });
  }

  function transactionalRepository() {
    const transaction = {
      get: vi.fn().mockResolvedValue(snapshot(true)),
      update: vi.fn(),
      delete: vi.fn(),
    };
    firestoreMocks.runTransaction.mockImplementation(
      async (_firestore, callback) => callback(transaction),
    );
    firestoreMocks.getDoc.mockResolvedValue(snapshot(true));
    return { repository: repository(), transaction };
  }

  it('Given a valid Firestore page, When listed, Then maps records and returns a cursor', async () => {
    firestoreMocks.getDocs.mockResolvedValue({
      docs: [snapshot(true), snapshot(true, 'unit-2')],
    });
    const result = await repository().list({
      access,
      page: { pageSize: 1, orderBy: [{ field: 'id', direction: 'asc' }] },
    });

    expect(result.items[0]).toMatchObject({
      id: 'unit-1',
      data: { name: 'litre' },
    });
    expect(result.nextCursor).toBe('cursor');
  });

  it('Given fewer documents than requested, When listed, Then reports no next page', async () => {
    firestoreMocks.getDocs.mockResolvedValue({ docs: [] });

    await expect(
      repository().list({
        access,
        page: { pageSize: 2, orderBy: [{ field: 'id', direction: 'asc' }] },
      }),
    ).resolves.toMatchObject({
      items: [],
      hasMore: false,
      nextCursor: undefined,
    });
  });

  it('Given optional Firestore metadata, When a record is mapped, Then preserves the metadata values', async () => {
    const value: FirestoreRecordDto<{ name: string }> = {
      ...dto,
      metadata: {
        ...dto.metadata,
        createdBy: 'keeper-1',
        updatedBy: 'keeper-2',
        lifecycleChangedAt: instant as never,
        lifecycleChangedBy: 'keeper-3',
      },
    };
    firestoreMocks.getDoc.mockResolvedValue(snapshot(true, 'unit-1', value));

    await expect(
      repository().get({ access, id: createEntityId('unit-1') }),
    ).resolves.toMatchObject({
      metadata: {
        createdBy: 'keeper-1',
        updatedBy: 'keeper-2',
        lifecycleChangedBy: 'keeper-3',
        lifecycleChangedAt: { epochMilliseconds: 0 },
      },
    });
  });

  it('Given an explicit lifecycle filter, When reading a marked record, Then returns it when requested', async () => {
    const marked: FirestoreRecordDto<{ name: string }> = {
      ...dto,
      lifecycle: { status: 'marked-for-deletion' },
    };
    firestoreMocks.getDoc.mockResolvedValue(snapshot(true, 'unit-1', marked));

    await expect(
      repository().get({
        access,
        id: createEntityId('unit-1'),
        lifecycle: ['marked-for-deletion'],
      }),
    ).resolves.toMatchObject({ lifecycle: { status: 'marked-for-deletion' } });
  });

  it('Given a missing Firestore document, When read, Then returns undefined', async () => {
    firestoreMocks.getDoc.mockResolvedValue(snapshot(false));

    await expect(
      repository().get({ access, id: createEntityId('missing') }),
    ).resolves.toBeUndefined();
  });

  it('Given a valid create command, When persisted, Then uses server timestamps and maps the stored record', async () => {
    firestoreMocks.setDoc.mockResolvedValue(undefined);
    firestoreMocks.getDoc.mockResolvedValue(snapshot(true));

    await expect(
      repository().create({ access, input: { name: 'litre' } }),
    ).resolves.toMatchObject({
      id: 'unit-1',
      revision: 1,
    });
    expect(firestoreMocks.serverTimestamp).toHaveBeenCalled();
  });

  it('Given a configured schema version, When creating a record, Then writes that version to Firestore', async () => {
    firestoreMocks.setDoc.mockResolvedValue(undefined);
    firestoreMocks.getDoc.mockResolvedValue(snapshot(true));
    const configured = createFirestoreCrudRepository({
      firestore: {} as never,
      collectionPath: 'units',
      recordSchema: schema,
      schemaVersion: 2,
      createId: (input: { name: string }) => input.name,
      createData: (input: { name: string }) => input,
      updateData: (_data, input: { name: string }) => input,
      buildQuery: () => ({}) as never,
      encodeCursor: () => 'cursor' as never,
    });

    await configured.create({ access, input: { name: 'gallon' } });

    expect(firestoreMocks.setDoc).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        metadata: expect.objectContaining({ schemaVersion: 2 }),
      }),
    );
  });

  it('Given an invalid schema version, When creating the repository, Then rejects the configuration', () => {
    expect(() =>
      createFirestoreCrudRepository({
        firestore: {} as never,
        collectionPath: 'units',
        recordSchema: schema,
        schemaVersion: 0,
        createId: (input: { name: string }) => input.name,
        createData: (input: { name: string }) => input,
        updateData: (_data, input: { name: string }) => input,
        buildQuery: () => ({}) as never,
        encodeCursor: () => 'cursor' as never,
      }),
    ).toThrow(RangeError);
  });

  it('Given an active record, When replaced, Then updates its data in a transaction', async () => {
    const { repository: current, transaction } = transactionalRepository();

    await expect(
      current.replace(
        { access, id: createEntityId('unit-1') },
        { name: 'gallon' },
      ),
    ).resolves.toMatchObject({
      id: 'unit-1',
    });
    expect(transaction.update).toHaveBeenCalled();
  });

  it('Given an active record, When marked for deletion, Then updates its lifecycle in a transaction', async () => {
    const { repository: current, transaction } = transactionalRepository();

    await current.markForDeletion({ access, id: createEntityId('unit-1') });

    expect(transaction.update).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ lifecycle: { status: 'marked-for-deletion' } }),
    );
  });

  it('Given a marked record, When restored, Then updates its lifecycle to active', async () => {
    const { repository: current, transaction } = transactionalRepository();

    await current.restore({ access, id: createEntityId('unit-1') });

    expect(transaction.update).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ lifecycle: { status: 'active' } }),
    );
  });

  it('Given a marked record, When deleted, Then removes it in a transaction', async () => {
    const marked: FirestoreRecordDto<{ name: string }> = {
      ...dto,
      lifecycle: { status: 'marked-for-deletion' },
    };
    const transaction = {
      get: vi.fn().mockResolvedValue(snapshot(true, 'unit-1', marked)),
      update: vi.fn(),
      delete: vi.fn(),
    };
    firestoreMocks.runTransaction.mockImplementation(
      async (_firestore, callback) => callback(transaction),
    );

    await expect(
      repository().delete({ access, id: createEntityId('unit-1') }),
    ).resolves.toBeUndefined();

    expect(transaction.delete).toHaveBeenCalled();
  });

  it('Given a missing record, When deleted, Then reports not found', async () => {
    const transaction = {
      get: vi.fn().mockResolvedValue(snapshot(false)),
      delete: vi.fn(),
      update: vi.fn(),
    };
    firestoreMocks.runTransaction.mockImplementation(
      async (_firestore, callback) => callback(transaction),
    );

    await expect(
      repository().delete({ access, id: createEntityId('missing') }),
    ).rejects.toMatchObject({
      code: 'not-found',
    });
  });

  it('Given an active record, When deleted, Then rejects because it is not marked', async () => {
    const transaction = {
      get: vi.fn().mockResolvedValue(snapshot(true)),
      delete: vi.fn(),
      update: vi.fn(),
    };
    firestoreMocks.runTransaction.mockImplementation(
      async (_firestore, callback) => callback(transaction),
    );

    await expect(
      repository().delete({ access, id: createEntityId('unit-1') }),
    ).rejects.toMatchObject({
      code: 'lifecycle',
    });
  });

  it('Given a stale delete revision, When deleted, Then rejects with a conflict', async () => {
    const marked: FirestoreRecordDto<{ name: string }> = {
      ...dto,
      lifecycle: { status: 'marked-for-deletion' },
    };
    const transaction = {
      get: vi.fn().mockResolvedValue(snapshot(true, 'unit-1', marked)),
      delete: vi.fn(),
      update: vi.fn(),
    };
    firestoreMocks.runTransaction.mockImplementation(
      async (_firestore, callback) => callback(transaction),
    );

    await expect(
      repository().delete({
        access,
        id: createEntityId('unit-1'),
        expectedRevision: 99,
      }),
    ).rejects.toMatchObject({
      code: 'conflict',
    });
  });

  it('Given a terminally deleted record, When restored, Then rejects with a lifecycle error', async () => {
    const deleted: FirestoreRecordDto<{ name: string }> = {
      ...dto,
      lifecycle: { status: 'deleted' },
    };
    const transaction = {
      get: vi.fn().mockResolvedValue(snapshot(true, 'unit-1', deleted)),
      delete: vi.fn(),
      update: vi.fn(),
    };
    firestoreMocks.runTransaction.mockImplementation(
      async (_firestore, callback) => callback(transaction),
    );

    await expect(
      repository().restore({ access, id: createEntityId('unit-1') }),
    ).rejects.toMatchObject({
      code: 'lifecycle',
    });
  });

  it('Given a terminally deleted record, When replaced, Then rejects before applying the update', async () => {
    const deleted: FirestoreRecordDto<{ name: string }> = {
      ...dto,
      lifecycle: { status: 'deleted' },
    };
    const transaction = {
      get: vi.fn().mockResolvedValue(snapshot(true, 'unit-1', deleted)),
      delete: vi.fn(),
      update: vi.fn(),
    };
    firestoreMocks.runTransaction.mockImplementation(
      async (_firestore, callback) => callback(transaction),
    );

    await expect(
      repository().replace(
        { access, id: createEntityId('unit-1') },
        { name: 'gallon' },
      ),
    ).rejects.toMatchObject({
      code: 'lifecycle',
    });
    expect(transaction.update).not.toHaveBeenCalled();
  });

  it('Given a stale replacement revision, When replaced, Then rejects with a conflict', async () => {
    const { repository: current } = transactionalRepository();

    await expect(
      current.replace(
        { access, id: createEntityId('unit-1'), expectedRevision: 99 },
        { name: 'gallon' },
      ),
    ).rejects.toMatchObject({
      code: 'conflict',
    });
  });

  it('Given an authorization callback, When an operation runs, Then delegates the operation and access context', async () => {
    const authorize = vi.fn();
    const authorizedRepository = createFirestoreCrudRepository({
      firestore: {} as never,
      collectionPath: 'units',
      recordSchema: schema,
      createId: (input: { name: string }) => input.name,
      createData: (input: { name: string }) => input,
      updateData: (_data, input: { name: string }) => input,
      buildQuery: () => ({}) as never,
      encodeCursor: () => 'cursor' as never,
      authorize,
    });

    firestoreMocks.getDoc.mockResolvedValue(snapshot(false));
    await authorizedRepository.get({ access, id: createEntityId('missing') });

    expect(authorize).toHaveBeenCalledWith(access, 'get');
  });

  it('Given a malformed Firestore document, When read, Then rejects at the DTO boundary', async () => {
    firestoreMocks.getDoc.mockResolvedValue({
      exists: () => true,
      id: 'unit-1',
      data: () => ({ invalid: true }),
    });
    const strictRepository = createFirestoreCrudRepository({
      firestore: {} as never,
      collectionPath: 'units',
      recordSchema: z.object({ invalid: z.never() }) as never,
      createId: () => 'unit-1',
      createData: () => ({ name: 'litre' }),
      updateData: (_data, input) => input,
      buildQuery: () => ({}) as never,
      encodeCursor: () => 'cursor' as never,
    });

    await expect(
      strictRepository.get({ access, id: createEntityId('unit-1') }),
    ).rejects.toThrow();
  });
});
