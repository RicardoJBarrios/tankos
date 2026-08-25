import { createEntityId } from '@tankos/data-access';
import { describe, expect, it, vi } from 'vitest';
import type { FirestoreCrudRepositoryOptions } from './firestore-crud-repository';
import {
  authorizeFirestoreAccess,
  authorizeFirestoreLifecycleRead,
  createFirestoreTimestampFactory,
  deleteFirestoreRecord,
  handleFirestoreError,
  requireFirestoreRevision,
  transactFirestoreUpdate,
} from './firestore-crud-repository-policy';

const firestoreMocks = vi.hoisted(() => ({
  doc: vi.fn((_firestore, _collection, id) => ({ id })),
  runTransaction: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  ...firestoreMocks,
  Timestamp: {
    now: vi.fn(() => ({ toMillis: () => 0 })),
    fromMillis: vi.fn((value: number) => ({ toMillis: () => value })),
  },
}));

describe('firestore CRUD policy', () => {
  const access = { principalId: createEntityId('keeper'), roles: [] };
  const record = {
    id: createEntityId('record'),
    data: {},
    lifecycle: { status: 'active' as const },
    revision: 1,
    metadata: {
      schemaVersion: 1,
      createdAt: { kind: 'instant' as const, epochMilliseconds: 0 },
      updatedAt: { kind: 'instant' as const, epochMilliseconds: 0 },
    },
  };
  const options = {
    authorize: undefined,
  } as unknown as FirestoreCrudRepositoryOptions<
    unknown,
    unknown,
    unknown,
    unknown
  >;

  const snapshot = (value: Record<string, unknown>) => ({
    exists: () => true,
    id: 'record',
    data: () => value,
  });

  const dto = {
    data: { name: 'litre' },
    lifecycle: { status: 'active' },
    revision: 1,
    metadata: {
      schemaVersion: 1,
      createdAt: { toMillis: () => 0 },
      updatedAt: { toMillis: () => 0 },
    },
  };

  const schema = { parse: (value: unknown) => value } as never;

  it('Given a matching revision, When validating a command, Then accepts it', () => {
    expect(() =>
      () => {
        requireFirestoreRevision(
          { id: record.id, access, expectedRevision: 1 },
          record,
        );
      },
    ).not.toThrow();
  });

  it('Given a clock, When creating a timestamp factory, Then it converts the technical instant', () => {
    const factory = createFirestoreTimestampFactory({
      now: () => ({ kind: 'instant', epochMilliseconds: 4321 }),
    });
    expect(factory().toMillis()).toBe(4321);
  });

  it('Given no clock, When creating a timestamp factory, Then it delegates to Firestore now', () => {
    expect(createFirestoreTimestampFactory(undefined)()).toBeDefined();
  });

  it('Given a data-access error, When handling a provider error, Then it preserves the original error', () => {
    const error = new Error('existing');
    error.name = 'DataAccessError';
    expect(handleFirestoreError(error, 'transient', 'fallback')).toBe(error);
  });

  it('Given an unknown provider error, When handling it, Then it creates the fallback data-access error', () => {
    expect(
      handleFirestoreError(new Error('provider'), 'transient', 'fallback'),
    ).toMatchObject({ code: 'transient' });
  });

  it('Given a stale revision, When validating a command, Then raises a conflict', () => {
    expect(() =>
      { requireFirestoreRevision(
        { id: record.id, access, expectedRevision: 2 },
        record,
      ); },
    ).toThrow('Record revision is stale');
  });

  it('Given a missing expected revision, When validating a command, Then raises a validation error', () => {
    expect(() => {
      requireFirestoreRevision(
        { id: record.id, access, expectedRevision: undefined },
        record,
      );
    }).toThrow('Record commands require an integer expectedRevision');
  });

  it('Given no host policy, When a lifecycle write is authorized, Then rejects it', async () => {
    await expect(
      authorizeFirestoreAccess(options, access, 'delete'),
    ).rejects.toThrow('requires an authorization policy');
  });

  it('Given a host policy, When a command is authorized, Then delegates the operation and lifecycle', async () => {
    const authorize = vi.fn();
    const configured = {
      ...options,
      authorize,
    } as unknown as FirestoreCrudRepositoryOptions<
      unknown,
      unknown,
      unknown,
      unknown
    >;
    await authorizeFirestoreAccess(configured, access, 'list', ['active']);
    expect(authorize).toHaveBeenCalledWith(access, 'list', ['active']);
  });

  it('Given hidden lifecycle states without a host policy, When reading, Then rejects the request', async () => {
    await expect(
      authorizeFirestoreLifecycleRead(
        options,
        access,
        ['marked-for-deletion'],
        'list',
      ),
    ).rejects.toThrow('hidden lifecycle states');
  });

  it('Given deleted lifecycle visibility without a host policy, When reading, Then rejects it before transport access', async () => {
    await expect(
      authorizeFirestoreLifecycleRead(options, access, ['deleted'], 'get'),
    ).rejects.toThrow('hidden lifecycle states');
  });

  it('Given hidden lifecycle visibility with a host policy, When reading, Then delegates it to the host', async () => {
    const authorize = vi.fn();
    const configured = {
      ...options,
      authorize,
    } as unknown as FirestoreCrudRepositoryOptions<
      unknown,
      unknown,
      unknown,
      unknown
    >;
    await authorizeFirestoreLifecycleRead(
      configured,
      access,
      ['deleted'],
      'get',
    );
    expect(authorize).toHaveBeenCalledWith(access, 'get', ['deleted']);
  });

  it('Given visible lifecycle states without a host policy, When reading, Then allows the request', async () => {
    await expect(
      authorizeFirestoreLifecycleRead(options, access, ['active'], 'list'),
    ).resolves.toBeUndefined();
  });

  it('Given no lifecycle filter without a host policy, When reading, Then allows the request', async () => {
    await expect(
      authorizeFirestoreLifecycleRead(options, access, undefined, 'get'),
    ).resolves.toBeUndefined();
  });

  it('Given a marked-for-deletion record, When deleting it, Then removes the document in the transaction', async () => {
    const transaction = {
      get: vi.fn().mockResolvedValue(
        snapshot({ ...dto, lifecycle: { status: 'marked-for-deletion' } }),
      ),
      delete: vi.fn(),
    };

    await deleteFirestoreRecord(
      transaction as never,
      { id: createEntityId('record'), access, expectedRevision: 1 },
      {
        firestore: {} as never,
        collectionPath: 'units',
        recordSchema: schema,
      } as never,
    );

    expect(transaction.delete).toHaveBeenCalledWith({ id: 'record' });
  });

  it('Given an active record, When updating it transactionally, Then increments revision and returns the changed record', async () => {
    const transaction = {
      get: vi.fn().mockResolvedValue(snapshot(dto)),
      update: vi.fn(),
    };
    firestoreMocks.runTransaction.mockImplementation(
      async (_firestore, callback) => callback(transaction),
    );

    const result = await transactFirestoreUpdate(
      {
        firestore: {} as never,
        collectionPath: 'units',
        recordSchema: schema,
      } as never,
      () => ({ toMillis: () => 0 }) as never,
      { id: createEntityId('record'), access, expectedRevision: 1 },
      'replace',
      (current) => ({
        data: { name: 'gallon' },
        lifecycle: current.lifecycle,
      }),
    );

    expect(result.data).toEqual({ name: 'gallon' });
    expect(result.revision).toBe(2);
    expect(transaction.update).toHaveBeenCalled();
  });
});
