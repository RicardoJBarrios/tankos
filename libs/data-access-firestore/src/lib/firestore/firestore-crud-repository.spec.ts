import { z } from 'zod';
import { describe, expect, it, vi } from 'vitest';
import { createEntityId } from '@tankos/data-access';
import {
  createFirestoreCrudRepository,
  firestoreErrorCode,
  mapRecord,
  timestamp,
  validateDocumentId,
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
  Timestamp: {
    now: vi.fn(),
    fromMillis: vi.fn((value: number) => ({ toMillis: () => value })),
  },
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
      authorize: () => undefined,
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

  it('Given a Firestore timestamp, When timestamp maps it, Then it returns the technical instant', () => {
    expect(timestamp({ toMillis: () => 1234 } as never)).toEqual({
      kind: 'instant',
      epochMilliseconds: 1234,
    });
  });

  it.each([
    ['permission-denied', 'forbidden'],
    ['not-found', 'not-found'],
    ['aborted', 'transient'],
    ['invalid-argument', 'validation'],
    ['unmapped', undefined],
  ] as const)('Given a Firestore code %s, When mapping it, Then returns %s', (code, expected) => {
    expect(firestoreErrorCode({ code })).toBe(expected);
  });

  it('Given a Zod error, When mapping its provider code, Then returns validation', () => {
    expect(firestoreErrorCode(new z.ZodError([]))).toBe('validation');
  });

  it.each(['', ' ', '.', '..', 'units/one'])(
    'Given an invalid document id %s, When validating it, Then it rejects the path segment',
    (id) => {
      expect(() => validateDocumentId(id)).toThrow('single path segments');
    },
  );

  it.each([null, undefined, 42, {}, []])(
    'Given a non-string document id %s, When validating it, Then rejects it',
    (id) => {
      expect(() => validateDocumentId(id as never)).toThrow(
        'single path segments',
      );
    },
  );

  it('Given a valid document id, When validating it, Then it preserves the id', () => {
    expect(validateDocumentId('unit-1')).toBe('unit-1');
  });

  it('Given a valid DTO snapshot, When mapRecord maps it, Then it converts technical timestamps and metadata', () => {
    expect(mapRecord(snapshot(true), schema)).toMatchObject({
      id: 'unit-1',
      data: { name: 'litre' },
      metadata: {
        createdAt: { epochMilliseconds: 0 },
        updatedAt: { epochMilliseconds: 0 },
      },
    });
  });

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

  it('Given a Firestore list provider failure, When listed, Then maps it to a transient data-access error', async () => {
    firestoreMocks.getDocs.mockRejectedValue(new Error('offline'));

    await expect(
      repository().list({
        access,
        page: { pageSize: 2, orderBy: [{ field: 'id', direction: 'asc' }] },
      }),
    ).rejects.toMatchObject({ code: 'transient' });
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

  it('Given a record excluded by the lifecycle filter, When read, Then returns undefined', async () => {
    firestoreMocks.getDoc.mockResolvedValue(snapshot(true));

    await expect(
      repository().get({
        access,
        id: createEntityId('unit-1'),
        lifecycle: ['inactive'],
      }),
    ).resolves.toBeUndefined();
  });

  it('Given a missing Firestore document, When read, Then returns undefined', async () => {
    firestoreMocks.getDoc.mockResolvedValue(snapshot(false));

    await expect(
      repository().get({ access, id: createEntityId('missing') }),
    ).resolves.toBeUndefined();
  });

  it('Given a valid create command, When persisted, Then uses injected technical timestamps without a read-after-write', async () => {
    const transaction = {
      get: vi.fn().mockResolvedValue(snapshot(false)),
      set: vi.fn(),
    };
    firestoreMocks.Timestamp.now.mockReturnValue(instant);
    firestoreMocks.getDoc.mockClear();
    firestoreMocks.runTransaction.mockImplementation(
      async (_firestore, callback) => callback(transaction),
    );

    await expect(
      repository().create({
        access: { ...access, requestId: 'create-unit-1' },
        input: { name: 'litre' },
      }),
    ).resolves.toMatchObject({
      id: 'litre',
      revision: 1,
    });
    expect(transaction.set).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        metadata: expect.objectContaining({ createdAt: instant }),
      }),
    );
    expect(firestoreMocks.getDoc).not.toHaveBeenCalled();
  });

  it('Given a configured schema version, When creating a record, Then writes that version to Firestore', async () => {
    const transaction = {
      get: vi.fn().mockResolvedValue(snapshot(false)),
      set: vi.fn(),
    };
    firestoreMocks.Timestamp.now.mockReturnValue(instant);
    firestoreMocks.runTransaction.mockImplementation(
      async (_firestore, callback) => callback(transaction),
    );
    const configured = createFirestoreCrudRepository({
      firestore: {} as never,
      collectionPath: 'units',
      recordSchema: schema,
      schemaVersion: 2,
      clock: { now: () => ({ kind: 'instant', epochMilliseconds: 1234 }) },
      createId: (input: { name: string }) => input.name,
      createData: (input: { name: string }) => input,
      updateData: (_data, input: { name: string }) => input,
      buildQuery: () => ({}) as never,
      encodeCursor: () => 'cursor' as never,
    });

    await configured.create({ access, input: { name: 'gallon' } });

    expect(transaction.set).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        metadata: expect.objectContaining({ schemaVersion: 2 }),
      }),
    );
  });

  it('Given an existing generated id, When creating a record, Then rejects before overwriting it', async () => {
    const transaction = {
      get: vi.fn().mockResolvedValue(snapshot(true)),
      set: vi.fn(),
    };
    firestoreMocks.runTransaction.mockImplementation(
      async (_firestore, callback) => callback(transaction),
    );

    await expect(
      repository().create({ access, input: { name: 'litre' } }),
    ).rejects.toMatchObject({ code: 'conflict' });
    expect(transaction.set).not.toHaveBeenCalled();
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
    firestoreMocks.getDoc.mockClear();

    await expect(
      current.replace(
        { access, id: createEntityId('unit-1'), expectedRevision: 1 },
        { name: 'gallon' },
      ),
    ).resolves.toMatchObject({
      id: 'unit-1',
    });
    expect(transaction.update).toHaveBeenCalled();
    expect(firestoreMocks.getDoc).not.toHaveBeenCalled();
  });

  it('Given an active record, When marked for deletion, Then updates its lifecycle in a transaction', async () => {
    const { repository: current, transaction } = transactionalRepository();

    await current.markForDeletion({
      access,
      id: createEntityId('unit-1'),
      expectedRevision: 1,
    });

    expect(transaction.update).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ lifecycle: { status: 'marked-for-deletion' } }),
    );
  });

  it('Given a marked record, When restored, Then updates its lifecycle to active', async () => {
    const { repository: current, transaction } = transactionalRepository();

    await current.restore({
      access,
      id: createEntityId('unit-1'),
      expectedRevision: 1,
    });

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
      repository().delete({
        access,
        id: createEntityId('unit-1'),
        expectedRevision: 1,
      }),
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
      repository().restore({
        access,
        id: createEntityId('unit-1'),
        expectedRevision: 1,
      }),
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
        { access, id: createEntityId('unit-1'), expectedRevision: 1 },
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

  it('Given a missing record, When replaced, Then reports not found before writing', async () => {
    const transaction = {
      get: vi.fn().mockResolvedValue(snapshot(false)),
      update: vi.fn(),
    };
    firestoreMocks.runTransaction.mockImplementation(
      async (_firestore, callback) => callback(transaction),
    );

    await expect(
      repository().replace(
        { access, id: createEntityId('missing'), expectedRevision: 1 },
        { name: 'gallon' },
      ),
    ).rejects.toMatchObject({ code: 'not-found' });
    expect(transaction.update).not.toHaveBeenCalled();
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

    expect(authorize).toHaveBeenCalledWith(access, 'get', undefined);
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

  it.each([
    ['permission-denied', 'forbidden'],
    ['not-found', 'not-found'],
    ['already-exists', 'conflict'],
    ['aborted', 'transient'],
    ['invalid-argument', 'validation'],
    ['failed-precondition', 'permanent'],
    ['deadline-exceeded', 'transient'],
    ['unavailable', 'transient'],
    ['resource-exhausted', 'transient'],
    ['unknown-provider-code', 'transient'],
    [undefined, 'transient'],
  ])(
    'Given a Firestore provider error (%s), When read, Then maps it to %s',
    async (providerCode, expectedCode) => {
      firestoreMocks.getDoc.mockRejectedValue(
        providerCode === undefined
          ? new Error('unknown')
          : { code: providerCode },
      );

      await expect(
        repository().get({ access, id: createEntityId('unit-1') }),
      ).rejects.toMatchObject({ code: expectedCode });
    },
  );
});
