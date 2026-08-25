import { describe, expect, it, vi } from 'vitest';
import { createBatchSubmissionService } from './batch-submission-service';
import {
  type BatchOperationRecord,
  type BatchMaterializerStorePort,
  type BatchSubmissionStorePort,
  createEntityId,
} from '../core';

const now = { kind: 'instant' as const, epochMilliseconds: 0 };

function record(
  status: BatchOperationRecord['status'] = 'materializing',
): BatchOperationRecord {
  return {
    batchId: createEntityId('batch-1'),
    principalId: createEntityId('keeper-1'),
    schema: 'units',
    operation: 'update',
    status,
    total: 0,
    processed: 0,
    warnings: 0,
    failures: 0,
    retryCount: 0,
    createdAt: now,
    updatedAt: now,
    selection: { fingerprint: 'request', total: 0, chunkCount: 0 },
    requestedSelection: { kind: 'filter', filter: { active: true } },
    requestFingerprint: 'request',
  };
}

function storeHarness(initial = record()) {
  let current: BatchOperationRecord | undefined = initial;
  const requireCurrent = (): BatchOperationRecord => {
    if (current === undefined) throw new Error('Expected current batch record');
    return current;
  };
  const chunks: unknown[] = [];
  let cancellationRequested = false;
  const store: BatchSubmissionStorePort = {
    create: async (value) => {
      current = value;
      return value;
    },
    get: async () => current,
    update: async (_id, patch) => {
      current = { ...requireCurrent(), ...patch };
      return current;
    },
    requestCancellation: async () => {
      cancellationRequested = true;
      return requireCurrent();
    },
    isCancellationRequested: async () => cancellationRequested,
    remove: async () => undefined,
  };
  const materializerStore: BatchMaterializerStorePort = {
    get: async () => current,
    claimMaterialization: async () => ({
      claimed: current?.status === 'materializing',
      record: requireCurrent(),
      lease: { owner: 'materializer-1', token: 'materializer-token-1' },
    }),
    update: async (_id, patch) => {
      current = { ...requireCurrent(), ...patch };
      return requireCurrent();
    },
    putChunk: async (_id, chunk) => chunks.push(chunk),
    isCancellationRequested: async () => cancellationRequested,
  };
  return {
    store,
    materializerStore,
    chunks,
    get cancellationRequested() {
      return cancellationRequested;
    },
    setCancellation: (value: boolean) => (cancellationRequested = value),
    setCurrent: (value: BatchOperationRecord | undefined) => (current = value),
  };
}

describe('createBatchSubmissionService', () => {
  it('Given a valid request, When submitted, Then persists materializing state and returns immediately', async () => {
    const harness = storeHarness();
    const service = createBatchSubmissionService({
      store: harness.store,
      materializerStore: harness.materializerStore,
      materializer: { materialize: async () => [] },
      clock: { now: () => now },
      createBatchId: () => createEntityId('batch-1'),
    });

    await expect(
      service.submit({
        access: { principalId: createEntityId('keeper-1'), roles: ['keeper'] },
        schema: 'units',
        operation: 'update',
        selection: { kind: 'filter', filter: { active: true } },
        confirmationToken: 'confirmed',
        idempotencyKey: 'request',
      }),
    ).resolves.toMatchObject({ status: 'materializing', total: 0 });
  });

  it('Given an existing batch, When fetched, Then returns its progress projection', async () => {
    const harness = storeHarness(record('queued'));
    const service = createBatchSubmissionService({
      store: harness.store,
      materializerStore: harness.materializerStore,
      materializer: { materialize: async () => [] },
      clock: { now: () => now },
      createBatchId: () => createEntityId('batch-1'),
    });

    await expect(service.get(createEntityId('batch-1'))).resolves.toMatchObject(
      {
        status: 'queued',
      },
    );
  });

  it('Given an active request, When cancelled, Then requests cooperative cancellation from the store', async () => {
    const harness = storeHarness(record('queued'));
    const service = createBatchSubmissionService({
      store: harness.store,
      materializerStore: harness.materializerStore,
      materializer: { materialize: async () => [] },
      clock: { now: () => now },
      createBatchId: () => createEntityId('batch-1'),
    });

    await service.cancel(createEntityId('batch-1'));

    expect(harness.cancellationRequested).toBe(true);
  });

  it('Given a completed request, When cancelled, Then returns it without requesting cancellation', async () => {
    const harness = storeHarness(record('completed'));
    const service = createBatchSubmissionService({
      store: harness.store,
      materializerStore: harness.materializerStore,
      materializer: { materialize: async () => [] },
      clock: { now: () => now },
      createBatchId: () => createEntityId('batch-1'),
    });

    await expect(
      service.cancel(createEntityId('batch-1')),
    ).resolves.toMatchObject({
      status: 'completed',
    });
    expect(harness.cancellationRequested).toBe(false);
  });

  it('Given a primitive payload, When submitted, Then includes it in the stable request fingerprint', async () => {
    const harness = storeHarness();
    const service = createBatchSubmissionService({
      store: harness.store,
      materializerStore: harness.materializerStore,
      materializer: { materialize: async () => [] },
      clock: { now: () => now },
      createBatchId: () => createEntityId('batch-1'),
    });

    await expect(
      service.submit({
        access: { principalId: createEntityId('keeper-1'), roles: ['keeper'] },
        schema: 'units',
        operation: 'update',
        selection: { kind: 'ids', ids: [createEntityId('unit-1')] },
        confirmationToken: 'confirmed',
        idempotencyKey: 'request',
        payload: 0,
      }),
    ).resolves.toMatchObject({ status: 'materializing' });
  });

  it('Given a materializing request, When materialized, Then writes bounded chunks and queues it', async () => {
    const harness = storeHarness();
    const ids = [1, 2, 3, 4, 5].map((id) =>
      createEntityId(`unit-${String(id)}`),
    );
    const service = createBatchSubmissionService({
      store: harness.store,
      materializerStore: harness.materializerStore,
      materializer: { materialize: async () => ids },
      clock: { now: () => now },
      createBatchId: () => createEntityId('batch-1'),
      chunkSize: 2,
    });

    await expect(
      service.materialize(createEntityId('batch-1')),
    ).resolves.toMatchObject({
      status: 'queued',
      total: 5,
    });
    expect(harness.chunks).toHaveLength(3);
    expect(harness.chunks[2]).toMatchObject({
      ids: [createEntityId('unit-5')],
    });
  });

  it('Given a claimed materialization without a lease, When materialized, Then rejects the fencing violation', async () => {
    const harness = storeHarness();
    harness.materializerStore.claimMaterialization = async () => ({
      claimed: true,
      record: record(),
    });
    const service = createBatchSubmissionService({
      store: harness.store,
      materializerStore: harness.materializerStore,
      materializer: { materialize: async () => [] },
      clock: { now: () => now },
      createBatchId: () => createEntityId('batch-1'),
    });

    await expect(
      service.materialize(createEntityId('batch-1')),
    ).rejects.toMatchObject({
      code: 'conflict',
    });
  });

  it('Given a claimed non-materializing record, When materialized, Then returns its current progress without materializing ids', async () => {
    const harness = storeHarness(record('queued'));
    harness.materializerStore.claimMaterialization = async () => ({
      claimed: true,
      record: record('queued'),
      lease: { owner: 'materializer-1', token: 'token-1' },
    });
    const materialize = vi.fn().mockResolvedValue([]);
    const service = createBatchSubmissionService({
      store: harness.store,
      materializerStore: harness.materializerStore,
      materializer: { materialize },
      clock: { now: () => now },
      createBatchId: () => createEntityId('batch-1'),
    });

    await expect(
      service.materialize(createEntityId('batch-1')),
    ).resolves.toMatchObject({
      status: 'queued',
    });
    expect(materialize).not.toHaveBeenCalled();
  });

  it('Given a claimed materializing request with no matching ids, When materialized, Then queues it without chunks', async () => {
    const harness = storeHarness();
    const service = createBatchSubmissionService({
      store: harness.store,
      materializerStore: harness.materializerStore,
      materializer: { materialize: async () => [] },
      clock: { now: () => now },
      createBatchId: () => createEntityId('batch-1'),
    });

    await expect(
      service.materialize(createEntityId('batch-1')),
    ).resolves.toMatchObject({
      status: 'queued',
      total: 0,
    });
    expect(harness.chunks).toHaveLength(0);
  });

  it('Given cancellation during materialization, When materialized, Then does not queue or write chunks', async () => {
    const harness = storeHarness();
    const service = createBatchSubmissionService({
      store: harness.store,
      materializerStore: harness.materializerStore,
      materializer: {
        materialize: async () => {
          harness.setCancellation(true);
          return [createEntityId('unit-1')];
        },
      },
      clock: { now: () => now },
      createBatchId: () => createEntityId('batch-1'),
    });

    await expect(
      service.materialize(createEntityId('batch-1')),
    ).resolves.toMatchObject({
      status: 'cancelled',
    });
    expect(harness.chunks).toHaveLength(0);
  });

  it('Given a selection above the configured limit, When materialized, Then rejects before writing chunks', async () => {
    const harness = storeHarness();
    const materialize = vi
      .fn()
      .mockResolvedValue([createEntityId('unit-1'), createEntityId('unit-2')]);
    const service = createBatchSubmissionService({
      store: harness.store,
      materializerStore: harness.materializerStore,
      materializer: { materialize },
      clock: { now: () => now },
      createBatchId: () => createEntityId('batch-1'),
      maxTargets: 1,
    });

    await expect(
      service.materialize(createEntityId('batch-1')),
    ).rejects.toMatchObject({
      code: 'validation',
    });
    expect(harness.chunks).toHaveLength(0);
    expect(materialize).toHaveBeenCalledWith(expect.anything(), {
      maxTargets: 1,
    });
  });

  it('Given a completed request, When materialized again, Then does not rematerialize it', async () => {
    const harness = storeHarness(record('completed'));
    const materialize = vi.fn().mockResolvedValue([]);
    const service = createBatchSubmissionService({
      store: harness.store,
      materializerStore: harness.materializerStore,
      materializer: { materialize },
      clock: { now: () => now },
      createBatchId: () => createEntityId('batch-1'),
    });

    await expect(
      service.materialize(createEntityId('batch-1')),
    ).resolves.toMatchObject({
      status: 'completed',
    });
    expect(materialize).not.toHaveBeenCalled();
  });

  it('Given a store that loses the record while queuing, When materialized, Then reports the missing result', async () => {
    const harness = storeHarness();
    harness.materializerStore.update = async () => undefined as never;
    const service = createBatchSubmissionService({
      store: harness.store,
      materializerStore: harness.materializerStore,
      materializer: { materialize: async () => [] },
      clock: { now: () => now },
      createBatchId: () => createEntityId('batch-1'),
    });

    await expect(
      service.materialize(createEntityId('batch-1')),
    ).rejects.toMatchObject({
      code: 'not-found',
    });
  });

  it('Given a materialization store failure while queuing, When materialized, Then propagates the failure', async () => {
    const harness = storeHarness();
    harness.materializerStore.update = async () => {
      throw new Error('queue-failure');
    };
    const service = createBatchSubmissionService({
      store: harness.store,
      materializerStore: harness.materializerStore,
      materializer: { materialize: async () => [] },
      clock: { now: () => now },
      createBatchId: () => createEntityId('batch-1'),
    });

    await expect(
      service.materialize(createEntityId('batch-1')),
    ).rejects.toThrow('queue-failure');
  });

  it('Given duplicate IDs, When materialized, Then rejects the invalid request', async () => {
    const duplicate = storeHarness();
    const service = createBatchSubmissionService({
      store: duplicate.store,
      materializerStore: duplicate.materializerStore,
      materializer: {
        materialize: async () => [
          createEntityId('same'),
          createEntityId('same'),
        ],
      },
      clock: { now: () => now },
      createBatchId: () => createEntityId('batch-1'),
    });
    await expect(
      service.materialize(createEntityId('batch-1')),
    ).rejects.toMatchObject({ code: 'validation' });
  });

  it('Given missing state, When a batch is resumed, Then rejects with not-found', async () => {
    const harness = storeHarness();
    harness.setCurrent(undefined);
    const service = createBatchSubmissionService({
      store: harness.store,
      materializerStore: harness.materializerStore,
      materializer: { materialize: async () => [] },
      clock: { now: () => now },
      createBatchId: () => createEntityId('batch-1'),
    });

    await expect(
      service.resume(createEntityId('missing')),
    ).rejects.toMatchObject({ code: 'not-found' });
  });

  it.each(['queued', 'completed', 'cancelled'] as const)(
    'Given a %s request, When resumed, Then leaves its terminal or queued state unchanged',
    async (status) => {
      const harness = storeHarness(record(status));
      const service = createBatchSubmissionService({
        store: harness.store,
        materializerStore: harness.materializerStore,
        materializer: { materialize: async () => [] },
        clock: { now: () => now },
        createBatchId: () => createEntityId('batch-1'),
      });

      await expect(
        service.resume(createEntityId('batch-1')),
      ).resolves.toMatchObject({
        status,
      });
    },
  );

  it.each(['failed', 'interrupted'] as const)(
    'Given a %s request, When resumed, Then queues it for another execution',
    async (status) => {
      const harness = storeHarness(record(status));
      const service = createBatchSubmissionService({
        store: harness.store,
        materializerStore: harness.materializerStore,
        materializer: { materialize: async () => [] },
        clock: { now: () => now },
        createBatchId: () => createEntityId('batch-1'),
      });

      await expect(
        service.resume(createEntityId('batch-1')),
      ).resolves.toMatchObject({
        status: 'queued',
      });
    },
  );

  it('Given a running request, When resumed, Then rejects the concurrent transition', async () => {
    const harness = storeHarness(record('running'));
    const service = createBatchSubmissionService({
      store: harness.store,
      materializerStore: harness.materializerStore,
      materializer: { materialize: async () => [] },
      clock: { now: () => now },
      createBatchId: () => createEntityId('batch-1'),
    });

    await expect(
      service.resume(createEntityId('batch-1')),
    ).rejects.toMatchObject({
      code: 'conflict',
    });
  });

  it('Given a resumable request and a store failure, When resumed, Then propagates the failure', async () => {
    const harness = storeHarness(record('failed'));
    harness.store.update = async () => {
      throw new Error('resume-failure');
    };
    const service = createBatchSubmissionService({
      store: harness.store,
      materializerStore: harness.materializerStore,
      materializer: { materialize: async () => [] },
      clock: { now: () => now },
      createBatchId: () => createEntityId('batch-1'),
    });

    await expect(service.resume(createEntityId('batch-1'))).rejects.toThrow(
      'resume-failure',
    );
  });

  it.each([0, 401, NaN, Infinity, -Infinity])(
    'Given invalid chunk size %s, When created, Then rejects configuration',
    (chunkSize) => {
      const harness = storeHarness();
      expect(() =>
        createBatchSubmissionService({
          store: harness.store,
          materializerStore: harness.materializerStore,
          materializer: { materialize: async () => [] },
          clock: { now: () => now },
          createBatchId: () => createEntityId('batch-1'),
          chunkSize,
        }),
      ).toThrow(RangeError);
    },
  );

  it.each([0, NaN, Infinity, -Infinity])(
    'Given invalid max targets %s, When created, Then rejects configuration',
    (maxTargets) => {
      const harness = storeHarness();
      expect(() =>
        createBatchSubmissionService({
          store: harness.store,
          materializerStore: harness.materializerStore,
          materializer: { materialize: async () => [] },
          clock: { now: () => now },
          createBatchId: () => createEntityId('batch-1'),
          maxTargets,
        }),
      ).toThrow(RangeError);
    },
  );

  it('Given an empty materializer owner, When created, Then rejects configuration', () => {
    const harness = storeHarness();
    expect(() =>
      createBatchSubmissionService({
        store: harness.store,
        materializerStore: harness.materializerStore,
        materializer: { materialize: async () => [] },
        clock: { now: () => now },
        createBatchId: () => createEntityId('batch-1'),
        materializerOwnerId: '   ',
      }),
    ).toThrow(RangeError);
  });

  it('Given an invalid materialization lease, When created, Then rejects configuration', () => {
    const harness = storeHarness();
    expect(() =>
      createBatchSubmissionService({
        store: harness.store,
        materializerStore: harness.materializerStore,
        materializer: { materialize: async () => [] },
        clock: { now: () => now },
        createBatchId: () => createEntityId('batch-1'),
        materializationLeaseDurationMilliseconds: 0,
      }),
    ).toThrow(RangeError);
  });

  it.each([999, NaN, Infinity, -Infinity])(
    'Given invalid max request bytes %s, When created, Then rejects configuration',
    (maxRequestBytes) => {
      const harness = storeHarness();
      expect(() =>
        createBatchSubmissionService({
          store: harness.store,
          materializerStore: harness.materializerStore,
          materializer: { materialize: async () => [] },
          clock: { now: () => now },
          createBatchId: () => createEntityId('batch-1'),
          maxRequestBytes,
        }),
      ).toThrow(RangeError);
    },
  );

  it('Given a request fingerprint above the configured byte limit, When submitted, Then rejects before persistence', async () => {
    const harness = storeHarness();
    const service = createBatchSubmissionService({
      store: harness.store,
      materializerStore: harness.materializerStore,
      materializer: { materialize: async () => [] },
      clock: { now: () => now },
      createBatchId: () => createEntityId('batch-1'),
      maxRequestBytes: 1_000,
    });

    await expect(
      service.submit({
        access: { principalId: createEntityId('keeper-1'), roles: ['keeper'] },
        schema: 'units',
        operation: 'update',
        selection: { kind: 'filter', filter: { active: true } },
        confirmationToken: 'confirmed',
        idempotencyKey: 'request',
        payload: 'x'.repeat(2_000),
      }),
    ).rejects.toMatchObject({ code: 'validation' });
  });
});
