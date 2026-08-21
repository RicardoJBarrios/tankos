import { Timestamp } from 'firebase-admin/firestore';
import { describe, expect, it, vi } from 'vitest';
import {
  createEntityId,
  type BatchOperationRecord,
} from '@tank-os/data-access';
import { createFirestoreAdminBatchStore } from './firestore-admin-batch-store';

interface FakeReference {
  readonly path: string;
  readonly get: () => Promise<FakeSnapshot>;
  readonly set: (value: Record<string, unknown>) => Promise<void>;
  readonly update: (value: Record<string, unknown>) => Promise<void>;
  readonly collection: (name: string) => FakeCollection;
}

interface FakeSnapshot {
  readonly exists: boolean;
  readonly data: () => Record<string, unknown> | undefined;
  readonly ref: FakeReference;
}

interface FakeCollection {
  readonly doc: (id: string) => FakeReference;
  readonly get: () => Promise<{ readonly docs: readonly FakeSnapshot[] }>;
  readonly where: () => {
    readonly get: FakeCollection['get'];
    readonly limit: (value: number) => { readonly get: FakeCollection['get'] };
  };
}

function createHarness(failure?: unknown, writeFailure?: unknown) {
  const values = new Map<string, Record<string, unknown>>();
  const snapshot = (path: string) => ({
    exists: values.has(path),
    data: () => values.get(path),
    ref: reference(path),
  });
  const reference = (path: string): FakeReference => ({
    path,
    get: async () => {
      if (failure !== undefined) throw failure;
      return snapshot(path);
    },
    set: async (value: Record<string, unknown>) => {
      if (writeFailure !== undefined) throw writeFailure;
      values.set(path, value);
    },
    update: async (value: Record<string, unknown>) => {
      if (writeFailure !== undefined) throw writeFailure;
      const current = values.get(path);
      if (!current) throw { code: 'not-found' };
      values.set(path, { ...current, ...value });
    },
    collection: (name: string) => collection(`${path}/${name}`),
  });
  const collection = (path: string): FakeCollection => ({
    doc: (id: string) => reference(`${path}/${id}`),
    get: async () => {
      if (failure !== undefined) throw failure;
      return {
        docs: [...values.entries()]
          .filter(
            ([key]) =>
              key.startsWith(`${path}/`) &&
              key.slice(path.length + 1).includes('/') === false,
          )
          .map(([key, value]) => ({ ref: reference(key), data: () => value })),
      };
    },
    where: () => ({
      get: () => collection(path).get(),
      limit: (value) => ({
        get: async () => {
          const result = await collection(path).get();
          return { docs: result.docs.slice(0, value) };
        },
      }),
    }),
  });
  const batch = {
    delete: vi.fn((ref: { path: string }) => values.delete(ref.path)),
    update: vi.fn((ref: { path: string }, value: Record<string, unknown>) => {
      const current = values.get(ref.path);
      if (!current) throw { code: 'not-found' };
      values.set(ref.path, { ...current, ...value });
    }),
    commit: vi.fn().mockImplementation(async () => {
      if (writeFailure !== undefined) throw writeFailure;
    }),
  };
  const transaction = {
    get: async (ref: { get: () => Promise<unknown> }) => ref.get(),
    create: (ref: { path: string }, value: Record<string, unknown>) => {
      if (values.has(ref.path)) throw { code: 'already-exists' };
      values.set(ref.path, value);
    },
    update: (ref: { path: string }, value: Record<string, unknown>) => {
      const current = values.get(ref.path);
      if (!current) throw { code: 'not-found' };
      values.set(ref.path, { ...current, ...value });
    },
  };
  const firestore = {
    collection,
    runTransaction: async (
      callback: (value: typeof transaction) => Promise<unknown>,
    ) => callback(transaction),
    batch: () => batch,
  };
  return { firestore, values, batch };
}

function record(): BatchOperationRecord<{ label: string }> {
  return {
    batchId: createEntityId('batch-1'),
    principalId: createEntityId('keeper-1'),
    schema: 'units',
    operation: 'update',
    status: 'queued',
    total: 2,
    processed: 0,
    warnings: 0,
    failures: 0,
    retryCount: 0,
    createdAt: { kind: 'instant', epochMilliseconds: 0 },
    updatedAt: { kind: 'instant', epochMilliseconds: 0 },
    selection: { fingerprint: 'scope', total: 2, chunkCount: 1 },
    payload: { label: 'litre' },
    requestFingerprint: 'request-1',
  };
}

describe('createFirestoreAdminBatchStore', () => {
  it('Given a new operation, When created, Then atomically stores its summary and idempotency reservation', async () => {
    const { firestore } = createHarness();
    const store = createFirestoreAdminBatchStore({
      firestore: firestore as never,
      collectionPath: 'batches',
      now: () => Timestamp.fromMillis(0),
    });

    await expect(store.create(record(), 'request-key')).resolves.toMatchObject({
      batchId: 'batch-1',
      principalId: 'keeper-1',
    });
    await expect(store.get(createEntityId('batch-1'))).resolves.toMatchObject({
      selection: { fingerprint: 'scope' },
    });
  });

  it('Given a queued operation, When claimed, Then atomically returns a running record', async () => {
    const { firestore } = createHarness();
    const store = createFirestoreAdminBatchStore({
      firestore: firestore as never,
      collectionPath: 'batches',
    });
    await store.create(record(), 'claim-key');

    await expect(
      store.claim(createEntityId('batch-1'), {
        workerId: 'worker-1',
        now: { kind: 'instant', epochMilliseconds: 1000 },
        leaseDurationMilliseconds: 60_000,
      }),
    ).resolves.toMatchObject({
      claimed: true,
      record: { status: 'running', updatedAt: { epochMilliseconds: 1000 } },
    });
  });

  it.each(['materializing', 'running', 'cancelled', 'completed', 'completed-with-warnings'] as const)(
    'Given a %s operation, When claimed, Then leaves it owned by its current state',
    async (status) => {
      const { firestore } = createHarness();
      const store = createFirestoreAdminBatchStore({
        firestore: firestore as never,
      });
      await store.create(
        {
          ...record(),
          status,
          ...(status === 'running'
            ? {
                leaseOwner: 'other-worker',
                leaseUntil: { kind: 'instant' as const, epochMilliseconds: 2000 },
              }
            : {}),
        },
        `claim-${status}`,
      );

      await expect(
        store.claim(createEntityId('batch-1'), {
          workerId: 'worker-1',
          now: { kind: 'instant', epochMilliseconds: 1000 },
          leaseDurationMilliseconds: 60_000,
        }),
      ).resolves.toMatchObject({ claimed: false, record: { status } });
    },
  );

  it('Given missing or unavailable batch state, When claimed, Then maps the provider error', async () => {
    const missing = createFirestoreAdminBatchStore({
      firestore: createHarness().firestore as never,
    });
    await expect(
      missing.claim(createEntityId('missing'), {
        workerId: 'worker-1',
        now: { kind: 'instant', epochMilliseconds: 0 },
        leaseDurationMilliseconds: 60_000,
      }),
    ).rejects.toMatchObject({ code: 'not-found' });

    const unavailable = createFirestoreAdminBatchStore({
      firestore: createHarness(new Error('unavailable')).firestore as never,
    });
    await expect(
      unavailable.claim(createEntityId('batch-1'), {
        workerId: 'worker-1',
        now: { kind: 'instant', epochMilliseconds: 0 },
        leaseDurationMilliseconds: 60_000,
      }),
    ).rejects.toMatchObject({ code: 'transient' });
  });

  it('Given an invalid worker claim, When claimed, Then rejects validation before reading Firestore', async () => {
    const { firestore } = createHarness();
    const store = createFirestoreAdminBatchStore({
      firestore: firestore as never,
    });

    await expect(
      store.claim(createEntityId('batch-1'), {
        workerId: ' ',
        now: { kind: 'instant', epochMilliseconds: 0 },
        leaseDurationMilliseconds: 0,
      }),
    ).rejects.toMatchObject({ code: 'validation' });
  });

  it('Given a repeated idempotency key, When the fingerprint matches, Then returns the original operation', async () => {
    const { firestore } = createHarness();
    const store = createFirestoreAdminBatchStore({
      firestore: firestore as never,
    });
    await store.create(record(), 'same-key');

    await expect(
      store.create(
        { ...record(), batchId: createEntityId('batch-2') },
        'same-key',
      ),
    ).resolves.toMatchObject({
      batchId: 'batch-1',
    });
  });

  it('Given a removed operation without retained idempotency data, When retried, Then reports not found', async () => {
    const { firestore, values } = createHarness();
    const store = createFirestoreAdminBatchStore({
      firestore: firestore as never,
      collectionPath: 'batches',
    });
    await store.create(record(), 'same-key');
    values.delete('batches/batch-1');
    const reservation = values.get(
      'batches__idempotency/keeper-1%00same-key',
    );
    values.set('batches__idempotency/keeper-1%00same-key', {
      ...reservation,
      record: undefined,
    });

    await expect(
      store.create(
        { ...record(), batchId: createEntityId('batch-2') },
        'same-key',
      ),
    ).rejects.toMatchObject({ code: 'not-found' });
  });

  it('Given a reused idempotency key with another fingerprint, When created, Then reports conflict', async () => {
    const { firestore } = createHarness();
    const store = createFirestoreAdminBatchStore({
      firestore: firestore as never,
    });
    await store.create(record(), 'same-key');

    await expect(
      store.create(
        { ...record(), requestFingerprint: 'different' },
        'same-key',
      ),
    ).rejects.toMatchObject({ code: 'conflict' });
  });

  it('Given an existing batch id, When created with another key, Then reports conflict', async () => {
    const { firestore } = createHarness();
    const store = createFirestoreAdminBatchStore({
      firestore: firestore as never,
    });
    await store.create(record(), 'first-key');

    await expect(store.create(record(), 'second-key')).rejects.toMatchObject({
      code: 'conflict',
    });
  });

  it('Given a persisted operation, When updated, chunked and resulted, Then keeps summary and details separate', async () => {
    const { firestore } = createHarness();
    const store = createFirestoreAdminBatchStore({
      firestore: firestore as never,
    });
    await store.create(record(), 'key');
    await expect(
      store.update(createEntityId('batch-1'), {
        status: 'running',
        updatedAt: { kind: 'instant', epochMilliseconds: 1 },
        leaseOwner: 'worker-1',
        leaseUntil: { kind: 'instant', epochMilliseconds: 2 },
      }),
    ).resolves.toMatchObject({
      status: 'running',
      updatedAt: { epochMilliseconds: 1 },
    });
    await expect(
      store.update(createEntityId('batch-1'), {
        updatedAt: { kind: 'instant', epochMilliseconds: 3 },
        leaseOwner: null,
        leaseUntil: null,
      }),
    ).resolves.toMatchObject({ leaseOwner: undefined, leaseUntil: undefined });
    await expect(
      store.update(createEntityId('batch-1'), {
        updatedAt: { kind: 'instant', epochMilliseconds: 4 },
      }),
    ).resolves.toMatchObject({ leaseUntil: undefined });
    await store.putChunk(createEntityId('batch-1'), {
      chunkId: createEntityId('chunk-1'),
      ids: [createEntityId('unit-1')],
      status: 'pending',
      attempts: 0,
    });
    await store.putResult(
      createEntityId('batch-1'),
      createEntityId('chunk-1'),
      {
        id: createEntityId('unit-1'),
        outcome: 'succeeded',
      },
    );
    await expect(
      store.listRunnableChunks(createEntityId('batch-1')),
    ).resolves.toHaveLength(1);
    await expect(
      store.listRunnableChunks(createEntityId('batch-1'), 1),
    ).resolves.toHaveLength(1);
  });

  it('Given a running operation, When cancellation is requested, Then exposes it to the worker', async () => {
    const { firestore } = createHarness();
    const store = createFirestoreAdminBatchStore({
      firestore: firestore as never,
    });
    await store.create(record(), 'key');

    await store.requestCancellation(createEntityId('batch-1'));

    await expect(
      store.isCancellationRequested(createEntityId('batch-1')),
    ).resolves.toBe(true);
  });

  it('Given missing batch state, When updating or cancelling, Then reports not found', async () => {
    const { firestore } = createHarness();
    const store = createFirestoreAdminBatchStore({
      firestore: firestore as never,
    });

    await expect(
      store.update(createEntityId('missing'), {
        updatedAt: { kind: 'instant', epochMilliseconds: 0 },
      }),
    ).rejects.toMatchObject({ code: 'not-found' });
    await expect(
      store.requestCancellation(createEntityId('missing')),
    ).rejects.toMatchObject({ code: 'not-found' });
    await expect(
      store.isCancellationRequested(createEntityId('missing')),
    ).rejects.toMatchObject({ code: 'not-found' });
    await expect(store.remove(createEntityId('missing'))).rejects.toMatchObject({
      code: 'not-found',
    });
  });

  it('Given terminal detail documents, When removed, Then deletes details and summary but keeps idempotency history', async () => {
    const { firestore } = createHarness();
    const store = createFirestoreAdminBatchStore({
      firestore: firestore as never,
    });
    await store.create(record(), 'key');
    await store.putChunk(createEntityId('batch-1'), {
      chunkId: createEntityId('chunk-1'),
      ids: [createEntityId('unit-1')],
      status: 'completed',
      attempts: 1,
    });
    await store.remove(createEntityId('batch-1'));

    await expect(store.get(createEntityId('batch-1'))).resolves.toBeUndefined();
    await expect(
      store.create({ ...record(), batchId: createEntityId('batch-2') }, 'key'),
    ).resolves.toMatchObject({
      batchId: 'batch-1',
    });
  });

  it.each([
    ['permission-denied', 'forbidden'],
    ['not-found', 'not-found'],
    ['already-exists', 'conflict'],
    ['invalid-argument', 'validation'],
    ['unavailable', 'transient'],
    [undefined, 'transient'],
  ])(
    'Given a Firestore error (%s), When reading, Then maps it to %s',
    async (providerCode, expected) => {
      const { firestore } = createHarness(
        providerCode === undefined
          ? new Error('unknown')
          : { code: providerCode },
      );
      const store = createFirestoreAdminBatchStore({
        firestore: firestore as never,
      });

      await expect(store.get(createEntityId('batch-1'))).rejects.toMatchObject({
        code: expected,
      });
    },
  );

  it('Given provider failures on detail operations, When called, Then maps each boundary error', async () => {
    const { firestore } = createHarness(undefined, new Error('unavailable'));
    const store = createFirestoreAdminBatchStore({
      firestore: firestore as never,
    });

    await expect(
      store.putChunk(createEntityId('batch-1'), {
        chunkId: createEntityId('chunk-1'),
        ids: [],
        status: 'pending',
        attempts: 0,
      }),
    ).rejects.toMatchObject({ code: 'transient' });
    await expect(
      store.putResult(createEntityId('batch-1'), createEntityId('chunk-1'), {
        id: createEntityId('one'),
        outcome: 'succeeded',
      }),
    ).rejects.toMatchObject({ code: 'transient' });
    await store.create(record(), 'provider-failure-key');
    await expect(store.remove(createEntityId('batch-1'))).rejects.toMatchObject(
      { code: 'transient' },
    );
  });

  it('Given a provider read failure, When chunks are listed, Then maps it to transient', async () => {
    const { firestore } = createHarness(new Error('unavailable'));
    const store = createFirestoreAdminBatchStore({
      firestore: firestore as never,
    });

    await expect(
      store.listRunnableChunks(createEntityId('batch-1')),
    ).rejects.toMatchObject({ code: 'transient' });
  });
});
