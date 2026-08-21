import { describe, expect, it, vi } from 'vitest';
import { createBatchSubmissionService } from './batch-submission-service';
import {
  type BatchOperationRecord,
  type BatchStorePort,
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
  const chunks: unknown[] = [];
  const store: BatchStorePort = {
    create: async (value) => {
      current = value;
      return value;
    },
    get: async () => current,
    claim: async () => ({ claimed: false, record: current as BatchOperationRecord }),
    update: async (_id, patch) => {
      current = { ...(current as BatchOperationRecord), ...patch };
      return current;
    },
    putChunk: async (_id, chunk) => chunks.push(chunk),
    listRunnableChunks: async () => [],
    putResult: async () => undefined,
    requestCancellation: async () => current as BatchOperationRecord,
    isCancellationRequested: async () => false,
    remove: async () => undefined,
  };
  return { store, chunks, setCurrent: (value: BatchOperationRecord | undefined) => (current = value) };
}

describe('createBatchSubmissionService', () => {
  it('Given a valid request, When submitted, Then persists materializing state and returns immediately', async () => {
    const harness = storeHarness();
    const service = createBatchSubmissionService({
      store: harness.store,
      materializer: { materialize: async () => [] },
      now: () => now,
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

  it('Given a primitive payload, When submitted, Then includes it in the stable request fingerprint', async () => {
    const harness = storeHarness();
    const service = createBatchSubmissionService({
      store: harness.store,
      materializer: { materialize: async () => [] },
      now: () => now,
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
    const ids = [1, 2, 3, 4, 5].map((id) => createEntityId(`unit-${id}`));
    const service = createBatchSubmissionService({
      store: harness.store,
      materializer: { materialize: async () => ids },
      now: () => now,
      createBatchId: () => createEntityId('batch-1'),
      chunkSize: 2,
    });

    await expect(service.materialize(createEntityId('batch-1'))).resolves.toMatchObject({
      status: 'queued',
      total: 5,
    });
    expect(harness.chunks).toHaveLength(3);
    expect(harness.chunks[2]).toMatchObject({ ids: [createEntityId('unit-5')] });
  });

  it('Given a selection above the configured limit, When materialized, Then rejects before writing chunks', async () => {
    const harness = storeHarness();
    const materialize = vi.fn().mockResolvedValue([
      createEntityId('unit-1'),
      createEntityId('unit-2'),
    ]);
    const service = createBatchSubmissionService({
      store: harness.store,
      materializer: { materialize },
      now: () => now,
      createBatchId: () => createEntityId('batch-1'),
      maxTargets: 1,
    });

    await expect(service.materialize(createEntityId('batch-1'))).rejects.toMatchObject({
      code: 'validation',
    });
    expect(harness.chunks).toHaveLength(0);
    expect(materialize).toHaveBeenCalledWith(
      expect.anything(),
      { maxTargets: 1 },
    );
  });

  it('Given a completed request, When materialized again, Then does not rematerialize it', async () => {
    const harness = storeHarness(record('completed'));
    const materialize = vi.fn().mockResolvedValue([]);
    const service = createBatchSubmissionService({
      store: harness.store,
      materializer: { materialize },
      now: () => now,
      createBatchId: () => createEntityId('batch-1'),
    });

    await expect(service.materialize(createEntityId('batch-1'))).resolves.toMatchObject({
      status: 'completed',
    });
    expect(materialize).not.toHaveBeenCalled();
  });

  it('Given a store that loses the record while queuing, When materialized, Then reports the missing result', async () => {
    const harness = storeHarness();
    harness.store.update = async () => undefined;
    const service = createBatchSubmissionService({
      store: harness.store,
      materializer: { materialize: async () => [] },
      now: () => now,
      createBatchId: () => createEntityId('batch-1'),
    });

    await expect(service.materialize(createEntityId('batch-1'))).rejects.toMatchObject({
      code: 'not-found',
    });
  });

  it('Given duplicate IDs or missing state, When materialized, Then rejects the invalid request', async () => {
    const duplicate = storeHarness();
    const service = createBatchSubmissionService({
      store: duplicate.store,
      materializer: { materialize: async () => [createEntityId('same'), createEntityId('same')] },
      now: () => now,
      createBatchId: () => createEntityId('batch-1'),
    });
    await expect(service.materialize(createEntityId('batch-1'))).rejects.toMatchObject({ code: 'validation' });

    duplicate.setCurrent(undefined);
    await expect(service.materialize(createEntityId('missing'))).rejects.toMatchObject({ code: 'not-found' });
  });

  it.each([0, 401, NaN, Infinity, -Infinity])(
    'Given invalid chunk size %s, When created, Then rejects configuration',
    (chunkSize) => {
      const harness = storeHarness();
      expect(() =>
        createBatchSubmissionService({
          store: harness.store,
          materializer: { materialize: async () => [] },
          now: () => now,
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
          materializer: { materialize: async () => [] },
          now: () => now,
          createBatchId: () => createEntityId('batch-1'),
          maxTargets,
        }),
      ).toThrow(RangeError);
    },
  );
});
