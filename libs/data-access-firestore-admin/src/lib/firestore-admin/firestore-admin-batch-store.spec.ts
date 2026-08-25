import { describe, expect, it } from 'vitest';
import { createEntityId } from '@tankos/data-access';
import { createFirestoreAdminBatchStore } from './firestore-admin-batch-store';
import {
  createHarness,
  createMaterializerStore,
  createSubmissionStore,
  createWorkerStore,
  leaseOf,
  record,
} from './firestore-admin-batch-store-test-harness.spec';

describe('createFirestoreAdminBatchStore', () => {
  it('Given a new operation, When created, Then atomically stores its summary and idempotency reservation', async () => {
    const { firestore } = createHarness();
    const store = createSubmissionStore({
      firestore: firestore as never,
      collectionPath: 'batches',
      clock: { now: () => ({ kind: 'instant', epochMilliseconds: 0 }) },
    });

    await expect(store.create(record(), 'request-key')).resolves.toMatchObject({
      batchId: 'batch-1',
      principalId: 'keeper-1',
    });
    await expect(store.get(createEntityId('batch-1'))).resolves.toMatchObject({
      selection: { fingerprint: 'scope' },
    });
  });

  it('Given a materializing operation, When materialization is claimed twice, Then only the first host owns the lease', async () => {
    const { firestore } = createHarness();
    const stores = createFirestoreAdminBatchStore({
      firestore: firestore as never,
      collectionPath: 'batches',
    });
    await stores.submissionStore.create(
      { ...record(), status: 'materializing' },
      'materialization-key',
    );
    const store = stores.materializerStore;

    await expect(
      store.claimMaterialization(createEntityId('batch-1'), {
        ownerId: 'materializer-1',
        now: { kind: 'instant', epochMilliseconds: 1000 },
        leaseDurationMilliseconds: 60_000,
      }),
    ).resolves.toMatchObject({ claimed: true });
    await expect(
      store.claimMaterialization(createEntityId('batch-1'), {
        ownerId: 'materializer-2',
        now: { kind: 'instant', epochMilliseconds: 1001 },
        leaseDurationMilliseconds: 60_000,
      }),
    ).resolves.toMatchObject({
      claimed: false,
      record: { materializationLeaseOwner: 'materializer-1' },
    });

    await expect(
      store.claimMaterialization(createEntityId('batch-1'), {
        ownerId: ' ',
        now: { kind: 'instant', epochMilliseconds: 1001 },
        leaseDurationMilliseconds: 60_000,
      }),
    ).rejects.toMatchObject({ code: 'validation' });
  });

  it('Given an expired materialization lease, When claimed, Then the next host takes ownership', async () => {
    const { firestore } = createHarness();
    const stores = createFirestoreAdminBatchStore({
      firestore: firestore as never,
      collectionPath: 'batches',
      clock: { now: () => ({ kind: 'instant', epochMilliseconds: 0 }) },
    });
    await stores.submissionStore.create(
      {
        ...record(),
        status: 'materializing',
        materializationLeaseOwner: 'old-host',
        materializationLeaseUntil: { kind: 'instant', epochMilliseconds: 1 },
      },
      'expired-materialization-key',
    );
    const store = stores.materializerStore;
    await expect(
      store.claimMaterialization(createEntityId('batch-1'), {
        ownerId: 'new-host',
        now: { kind: 'instant', epochMilliseconds: 10 },
        leaseDurationMilliseconds: 60_000,
      }),
    ).resolves.toMatchObject({ claimed: true, lease: { owner: 'new-host' } });
  });

  it('Given a reclaimed materialization lease, When the old host writes, Then rejects the stale write', async () => {
    const { firestore } = createHarness();
    let providerNow = 0;
    const stores = createFirestoreAdminBatchStore({
      firestore: firestore as never,
      clock: {
        now: () => ({ kind: 'instant', epochMilliseconds: providerNow }),
      },
    });
    await stores.submissionStore.create(
      { ...record(), status: 'materializing' },
      'materializer-fencing-key',
    );
    const first = await stores.materializerStore.claimMaterialization(
      createEntityId('batch-1'),
      {
        ownerId: 'old-host',
        now: { kind: 'instant', epochMilliseconds: 0 },
        leaseDurationMilliseconds: 10,
      },
    );
    await expect(
      stores.materializerStore.update(
        createEntityId('batch-1'),
        {
          updatedAt: { kind: 'instant', epochMilliseconds: 1 },
          materializationLeaseUntil: {
            kind: 'instant',
            epochMilliseconds: 10,
          },
        },
        leaseOf(first),
      ),
    ).resolves.toMatchObject({
      materializationLeaseToken: first.lease?.token,
    });
    await expect(
      stores.materializerStore.update(
        createEntityId('batch-1'),
        {
          updatedAt: { kind: 'instant', epochMilliseconds: 2 },
          materializationLeaseOwner: null,
          materializationLeaseToken: null,
          materializationLeaseUntil: null,
        },
        leaseOf(first),
      ),
    ).resolves.toMatchObject({
      materializationLeaseToken: undefined,
    });
    providerNow = 20;
    const second = await stores.materializerStore.claimMaterialization(
      createEntityId('batch-1'),
      {
        ownerId: 'new-host',
        now: { kind: 'instant', epochMilliseconds: 20 },
        leaseDurationMilliseconds: 10,
      },
    );

    await expect(
      stores.materializerStore.update(
        createEntityId('batch-1'),
        { updatedAt: { kind: 'instant', epochMilliseconds: 21 } },
        leaseOf(first),
      ),
    ).rejects.toMatchObject({ code: 'conflict' });
    await expect(
      stores.materializerStore.putChunk(
        createEntityId('batch-1'),
        {
          chunkId: createEntityId('chunk-stale'),
          ids: [createEntityId('unit-1')],
          status: 'pending',
          attempts: 0,
        },
        leaseOf(first),
      ),
    ).rejects.toMatchObject({ code: 'conflict' });
    expect(second.lease?.token).not.toBe(first.lease?.token);
  });

  it('Given a queued operation, When claimed, Then atomically returns a running record', async () => {
    const { firestore } = createHarness();
    const store = createWorkerStore({
      firestore: firestore as never,
      clock: { now: () => ({ kind: 'instant', epochMilliseconds: 0 }) },
      collectionPath: 'batches',
    });
    await store.create(record(), 'claim-key');

    await expect(
      store.claim(createEntityId('batch-1'), {
        ownerId: 'worker-1',
        now: { kind: 'instant', epochMilliseconds: 1000 },
        leaseDurationMilliseconds: 60_000,
      }),
    ).resolves.toMatchObject({
      claimed: true,
      record: { status: 'running', updatedAt: { epochMilliseconds: 1000 } },
    });
  });

  it('Given an expired worker lease, When an old worker writes, Then rejects the stale write', async () => {
    const { firestore } = createHarness();
    const store = createWorkerStore({
      firestore: firestore as never,
      clock: { now: () => ({ kind: 'instant', epochMilliseconds: 2_000 }) },
    });
    await store.create(record(), 'fencing-key');
    const claim = await store.claim(createEntityId('batch-1'), {
      ownerId: 'worker-1',
      now: { kind: 'instant', epochMilliseconds: 1_000 },
      leaseDurationMilliseconds: 500,
    });

    await expect(
      store.update(
        createEntityId('batch-1'),
        { updatedAt: { kind: 'instant', epochMilliseconds: 2_000 } },
        leaseOf(claim),
      ),
    ).rejects.toMatchObject({ code: 'conflict' });
  });

  it('Given an active worker lease, When worker details are written, Then fences every write with that lease', async () => {
    const { firestore } = createHarness();
    const store = createWorkerStore({
      firestore: firestore as never,
      clock: { now: () => ({ kind: 'instant', epochMilliseconds: 0 }) },
    });
    await store.create(record(), 'active-fencing-key');
    const claim = await store.claim(createEntityId('batch-1'), {
      ownerId: 'worker-1',
      now: { kind: 'instant', epochMilliseconds: 0 },
      leaseDurationMilliseconds: 500,
    });

    await store.putChunk(
      createEntityId('batch-1'),
      {
        chunkId: createEntityId('chunk-1'),
        ids: [createEntityId('unit-1')],
        status: 'running',
        attempts: 1,
      },
      leaseOf(claim),
    );
    await store.putResults(
      createEntityId('batch-1'),
      createEntityId('chunk-1'),
      [{ id: createEntityId('unit-1'), outcome: 'succeeded' }],
      leaseOf(claim),
    );
    await expect(
      store.update(
        createEntityId('batch-1'),
        { updatedAt: { kind: 'instant', epochMilliseconds: 1 } },
        leaseOf(claim),
      ),
    ).resolves.toMatchObject({ status: 'running' });
    await expect(
      store.update(
        createEntityId('batch-1'),
        {
          updatedAt: { kind: 'instant', epochMilliseconds: 2 },
          leaseUntil: { kind: 'instant', epochMilliseconds: 3_000 },
        },
        leaseOf(claim),
      ),
    ).resolves.toMatchObject({ leaseUntil: { epochMilliseconds: 3_000 } });
    await expect(
      store.update(
        createEntityId('batch-1'),
        {
          updatedAt: { kind: 'instant', epochMilliseconds: 3 },
          leaseUntil: null,
          materializationLeaseOwner: 'materializer-1',
          materializationLeaseUntil: {
            kind: 'instant',
            epochMilliseconds: 4_000,
          },
        },
        leaseOf(claim),
      ),
    ).resolves.toMatchObject({ leaseUntil: undefined });
  });

  it.each([
    'materializing',
    'running',
    'cancelled',
    'completed',
    'completed-with-warnings',
  ] as const)(
    'Given a %s operation, When claimed, Then leaves it owned by its current state',
    async (status) => {
      const { firestore } = createHarness();
      const store = createWorkerStore({
        firestore: firestore as never,
      });
      await store.create(
        {
          ...record(),
          status,
          ...(status === 'running'
            ? {
                leaseOwner: 'other-worker',
                leaseUntil: {
                  kind: 'instant' as const,
                  epochMilliseconds: 2000,
                },
              }
            : {}),
        },
        `claim-${status}`,
      );

      await expect(
        store.claim(createEntityId('batch-1'), {
          ownerId: 'worker-1',
          now: { kind: 'instant', epochMilliseconds: 1000 },
          leaseDurationMilliseconds: 60_000,
        }),
      ).resolves.toMatchObject({ claimed: false, record: { status } });
    },
  );

  it('Given missing or unavailable batch state, When claimed, Then maps the provider error', async () => {
    const missing = createWorkerStore({
      firestore: createHarness().firestore as never,
    });
    await expect(
      missing.claim(createEntityId('missing'), {
        ownerId: 'worker-1',
        now: { kind: 'instant', epochMilliseconds: 0 },
        leaseDurationMilliseconds: 60_000,
      }),
    ).rejects.toMatchObject({ code: 'not-found' });

    const unavailable = createFirestoreAdminBatchStore({
      firestore: createHarness(new Error('unavailable')).firestore as never,
    });
    await expect(
      unavailable.workerStore.claim(createEntityId('batch-1'), {
        ownerId: 'worker-1',
        now: { kind: 'instant', epochMilliseconds: 0 },
        leaseDurationMilliseconds: 60_000,
      }),
    ).rejects.toMatchObject({ code: 'transient' });
    await expect(
      unavailable.materializerStore.claimMaterialization(
        createEntityId('batch-1'),
        {
          ownerId: 'materializer-1',
          now: { kind: 'instant', epochMilliseconds: 0 },
          leaseDurationMilliseconds: 60_000,
        },
      ),
    ).rejects.toMatchObject({ code: 'transient' });
    await expect(
      createMaterializerStore({
        firestore: createHarness().firestore as never,
      }).claimMaterialization(createEntityId('missing'), {
        ownerId: 'materializer-1',
        now: { kind: 'instant', epochMilliseconds: 0 },
        leaseDurationMilliseconds: 60_000,
      }),
    ).rejects.toMatchObject({ code: 'not-found' });
  });

  it('Given an invalid worker claim, When claimed, Then rejects validation before reading Firestore', async () => {
    const { firestore } = createHarness();
    const store = createWorkerStore({
      firestore: firestore as never,
    });

    await expect(
      store.claim(createEntityId('batch-1'), {
        ownerId: ' ',
        now: { kind: 'instant', epochMilliseconds: 0 },
        leaseDurationMilliseconds: 0,
      }),
    ).rejects.toMatchObject({ code: 'validation' });
  });

  it('Given a repeated idempotency key, When the fingerprint matches, Then returns the original operation', async () => {
    const { firestore } = createHarness();
    const store = createWorkerStore({
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
    const store = createWorkerStore({
      firestore: firestore as never,
      collectionPath: 'batches',
    });
    await store.create(record(), 'same-key');
    values.delete('batches/batch-1');
    const reservation = values.get('batches__idempotency/keeper-1%00same-key');
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
    const store = createWorkerStore({
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
    const store = createWorkerStore({
      firestore: firestore as never,
    });
    await store.create(record(), 'first-key');

    await expect(store.create(record(), 'second-key')).rejects.toMatchObject({
      code: 'conflict',
    });
  });

  it('Given a persisted operation, When updated, chunked and resulted, Then keeps summary and details separate', async () => {
    const { firestore } = createHarness();
    const stores = createFirestoreAdminBatchStore({
      firestore: firestore as never,
      clock: { now: () => ({ kind: 'instant', epochMilliseconds: 0 }) },
    });
    const store = stores.submissionStore;
    const worker = stores.workerStore;
    await store.create(record(), 'key');
    await expect(
      store.update(createEntityId('batch-1'), {
        updatedAt: { kind: 'instant', epochMilliseconds: 1 },
      }),
    ).resolves.toMatchObject({ batchId: 'batch-1' });
    await expect(
      store.update(createEntityId('batch-1'), {
        updatedAt: { kind: 'instant', epochMilliseconds: 2 },
      }),
    ).resolves.toMatchObject({ batchId: 'batch-1' });
    await expect(
      store.update(createEntityId('batch-1'), {
        updatedAt: { kind: 'instant', epochMilliseconds: 3 },
      }),
    ).resolves.toMatchObject({ batchId: 'batch-1' });
    const claim = await worker.claim(createEntityId('batch-1'), {
      ownerId: 'worker-1',
      now: { kind: 'instant', epochMilliseconds: 0 },
      leaseDurationMilliseconds: 60_000,
    });
    await expect(
      worker.update(
        createEntityId('batch-1'),
        {
          updatedAt: { kind: 'instant', epochMilliseconds: 1 },
          leaseUntil: { kind: 'instant', epochMilliseconds: 60_000 },
        },
        leaseOf(claim),
      ),
    ).resolves.toMatchObject({ status: 'running' });
    await expect(
      worker.update(
        createEntityId('batch-1'),
        {
          updatedAt: { kind: 'instant', epochMilliseconds: 1 },
          leaseUntil: undefined,
        },
        leaseOf(claim),
      ),
    ).resolves.toMatchObject({ status: 'running' });
    await worker.putChunk(
      createEntityId('batch-1'),
      {
        chunkId: createEntityId('chunk-1'),
        ids: [createEntityId('unit-1')],
        status: 'pending',
        attempts: 0,
      },
      leaseOf(claim),
    );
    await worker.putResults(
      createEntityId('batch-1'),
      createEntityId('chunk-1'),
      [{ id: createEntityId('unit-1'), outcome: 'succeeded' }],
      leaseOf(claim),
    );
    await expect(
      worker.listRunnableChunks(createEntityId('batch-1')),
    ).resolves.toHaveLength(1);
    await expect(
      worker.listRunnableChunks(createEntityId('batch-1'), 1),
    ).resolves.toHaveLength(1);
  });

  it('Given a running operation, When cancellation is requested, Then exposes it to the worker', async () => {
    const { firestore } = createHarness();
    const store = createSubmissionStore({
      firestore: firestore as never,
    });
    await store.create(record(), 'key');

    await store.requestCancellation(createEntityId('batch-1'));

    await expect(
      store.isCancellationRequested(createEntityId('batch-1')),
    ).resolves.toBe(true);
  });

  it('Given a terminal operation, When cancellation is requested, Then leaves it unchanged', async () => {
    const { firestore } = createHarness();
    const store = createSubmissionStore({
      firestore: firestore as never,
    });
    await store.create({ ...record(), status: 'completed' }, 'terminal-key');

    await expect(
      store.requestCancellation(createEntityId('batch-1')),
    ).resolves.toMatchObject({ status: 'completed' });
    await expect(
      store.isCancellationRequested(createEntityId('batch-1')),
    ).resolves.toBe(false);
  });

  it('Given missing batch state, When updating or cancelling, Then reports not found', async () => {
    const { firestore } = createHarness();
    const store = createSubmissionStore({
      firestore: firestore as never,
    });
    const worker = createWorkerStore({
      firestore: firestore as never,
    });

    await expect(
      worker.update(createEntityId('missing'), {
        updatedAt: { kind: 'instant', epochMilliseconds: 0 },
      }),
    ).rejects.toMatchObject({ code: 'not-found' });
    await expect(
      store.requestCancellation(createEntityId('missing')),
    ).rejects.toMatchObject({ code: 'not-found' });
    await expect(
      store.isCancellationRequested(createEntityId('missing')),
    ).rejects.toMatchObject({ code: 'not-found' });
    await expect(store.remove(createEntityId('missing'))).rejects.toMatchObject(
      {
        code: 'not-found',
      },
    );
  });

  it('Given missing batch state, When fenced details are written, Then reports not found', async () => {
    const { firestore } = createHarness();
    const store = createWorkerStore({
      firestore: firestore as never,
    });
    const lease = { owner: 'worker-1', token: 'lease-1' };

    await expect(
      store.update(
        createEntityId('missing'),
        { updatedAt: { kind: 'instant', epochMilliseconds: 1 } },
        lease,
      ),
    ).rejects.toMatchObject({ code: 'not-found' });
    await expect(
      store.putChunk(
        createEntityId('missing'),
        {
          chunkId: createEntityId('chunk-1'),
          ids: [createEntityId('unit-1')],
          status: 'pending',
          attempts: 0,
        },
        lease,
      ),
    ).rejects.toMatchObject({ code: 'not-found' });
    await expect(
      store.putResults(
        createEntityId('missing'),
        createEntityId('chunk-1'),
        [{ id: createEntityId('unit-1'), outcome: 'succeeded' }],
        lease,
      ),
    ).rejects.toMatchObject({ code: 'not-found' });
  });

  it('Given terminal detail documents, When removed, Then deletes details and summary but keeps idempotency history', async () => {
    const { firestore } = createHarness();
    const stores = createFirestoreAdminBatchStore({
      firestore: firestore as never,
      collectionPath: 'batches',
      clock: { now: () => ({ kind: 'instant', epochMilliseconds: 0 }) },
    });
    const store = stores.submissionStore;
    const worker = stores.workerStore;
    await store.create(record(), 'key');
    const claim = await worker.claim(createEntityId('batch-1'), {
      ownerId: 'worker-1',
      now: { kind: 'instant', epochMilliseconds: 0 },
      leaseDurationMilliseconds: 60_000,
    });
    await worker.putChunk(
      createEntityId('batch-1'),
      {
        chunkId: createEntityId('chunk-1'),
        ids: [createEntityId('unit-1')],
        status: 'completed',
        attempts: 1,
      },
      leaseOf(claim),
    );
    await store.remove(createEntityId('batch-1'));

    await expect(store.get(createEntityId('batch-1'))).resolves.toBeUndefined();
    await expect(
      store.create({ ...record(), batchId: createEntityId('batch-2') }, 'key'),
    ).resolves.toMatchObject({
      batchId: 'batch-1',
    });
  });

  it('Given a legacy summary without idempotency metadata, When removed, Then deletes it without updating history', async () => {
    const { firestore, values } = createHarness();
    const store = createFirestoreAdminBatchStore({
      firestore: firestore as never,
      collectionPath: 'batches',
      clock: { now: () => ({ kind: 'instant', epochMilliseconds: 0 }) },
    }).submissionStore;
    await store.create(record(), 'legacy-key');
    const summary = values.get('batches/batch-1');
    if (summary) delete summary['idempotencyKey'];

    await expect(store.remove(createEntityId('batch-1'))).resolves.toBeUndefined();
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
      const store = createWorkerStore({
        firestore: firestore as never,
      });

      await expect(store.get(createEntityId('batch-1'))).rejects.toMatchObject({
        code: expected,
      });
    },
  );

  it('Given provider failures on detail operations, When called, Then maps each boundary error', async () => {
    const { firestore } = createHarness(undefined, new Error('unavailable'));
    const store = createSubmissionStore({
      firestore: firestore as never,
    });
    const worker = createWorkerStore({
      firestore: firestore as never,
      clock: { now: () => ({ kind: 'instant', epochMilliseconds: 0 }) },
    });

    await store.create(record(), 'provider-failure-key');
    const claim = await worker.claim(createEntityId('batch-1'), {
      ownerId: 'worker-1',
      now: { kind: 'instant', epochMilliseconds: 0 },
      leaseDurationMilliseconds: 60_000,
    });
    await expect(
      worker.putChunk(
        createEntityId('batch-1'),
        {
          chunkId: createEntityId('chunk-1'),
          ids: [],
          status: 'pending',
          attempts: 0,
        },
        leaseOf(claim),
      ),
    ).rejects.toMatchObject({ code: 'transient' });
    await expect(
      worker.putResults(
        createEntityId('batch-1'),
        createEntityId('chunk-1'),
        [{ id: createEntityId('one'), outcome: 'succeeded' }],
        leaseOf(claim),
      ),
    ).rejects.toMatchObject({ code: 'transient' });
    await expect(store.remove(createEntityId('batch-1'))).rejects.toMatchObject(
      { code: 'transient' },
    );
  });

  it('Given a provider read failure, When chunks are listed, Then maps it to transient', async () => {
    const { firestore } = createHarness(new Error('unavailable'));
    const store = createWorkerStore({
      firestore: firestore as never,
    });

    await expect(
      store.listRunnableChunks(createEntityId('batch-1')),
    ).rejects.toMatchObject({ code: 'transient' });
  });
});
