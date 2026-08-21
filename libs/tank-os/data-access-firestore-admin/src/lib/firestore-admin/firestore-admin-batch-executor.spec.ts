import { describe, expect, it, vi } from 'vitest';
import {
  createEntityId,
  type BatchOperationRecord,
  type BatchWorkerStorePort,
} from '@tank-os/data-access';
import { createFirestoreAdminBatchExecutor } from './firestore-admin-batch-executor';

const now = { kind: 'instant' as const, epochMilliseconds: 0 };
const authorize = () => undefined;
const base: BatchOperationRecord = {
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
  createdAt: now,
  updatedAt: now,
  selection: { fingerprint: 'scope', total: 2, chunkCount: 1 },
  requestFingerprint: 'request',
};

function storeHarness(
  chunks = [
    {
      chunkId: createEntityId('chunk-1'),
      ids: [createEntityId('one'), createEntityId('two')],
      status: 'pending' as const,
      attempts: 0,
    },
  ],
) {
  let current = base;
  let cancellation = false;
  const results: unknown[] = [];
  const chunksWritten: unknown[] = [];
  const store: BatchWorkerStorePort = {
    get: async () => current,
    update: async (_id, patch) => {
      current = { ...current, ...patch };
      return current;
    },
    claim: async () => {
      current = { ...current, status: 'running', updatedAt: now };
      return {
        claimed: true,
        record: current,
        lease: { owner: 'test-worker', token: 'lease-1' },
      };
    },
    putChunk: async (_id, chunk) => chunksWritten.push(chunk),
    listRunnableChunks: async (_id, limit) =>
      limit === undefined ? chunks : chunks.slice(0, limit),
    putResults: async (_batchId, _chunkId, batchResults) =>
      results.push(...batchResults),
    isCancellationRequested: async () => cancellation,
  };
  const cleanup = {
    remove: async () => {
      current = { ...current, status: 'completed' };
    },
  };
  return {
    store,
    cleanup,
    results,
    chunksWritten,
    setCancellation: (value: boolean) => (cancellation = value),
  };
}

describe('createFirestoreAdminBatchExecutor', () => {
  it('Given pending chunks, When executed, Then processes items, stores results and completes', async () => {
    const harness = storeHarness();
    const executor = createFirestoreAdminBatchExecutor({
      store: harness.store,
      workerId: 'test-worker',
      authorize,
      clock: { now: () => now },
      cleanupTerminal: false,
      execute: async (id) => ({ id, outcome: 'succeeded' }),
      concurrency: 1,
    });

    await expect(executor.run(base.batchId, base.principalId)).resolves.toMatchObject({
      status: 'completed',
      processed: 2,
    });
    expect(harness.results).toHaveLength(2);
    expect(harness.chunksWritten).toHaveLength(2);
  });

  it('Given a claimed batch without a fencing lease, When executed, Then rejects the unsafe claim', async () => {
    const harness = storeHarness();
    harness.store.claim = async () => ({
      claimed: true,
      record: base,
    });
    const executor = createFirestoreAdminBatchExecutor({
      store: harness.store,
      workerId: 'test-worker',
      authorize,
      clock: { now: () => now },
      cleanupTerminal: false,
      execute: async (id) => ({ id, outcome: 'succeeded' }),
    });

    await expect(executor.run(base.batchId, base.principalId)).rejects.toThrow(
      'A claimed batch must include a fencing lease',
    );
  });

  it('Given a missing batch, When executed, Then rejects before authorization', async () => {
    const harness = storeHarness();
    harness.store.get = async () => undefined;
    const authorize = vi.fn();
    const executor = createFirestoreAdminBatchExecutor({
      store: harness.store,
      workerId: 'test-worker',
      authorize,
      clock: { now: () => now },
      cleanupTerminal: false,
      execute: async (id) => ({ id, outcome: 'succeeded' }),
    });

    await expect(executor.run(base.batchId, base.principalId)).rejects.toThrow('Batch was not found');
    expect(authorize).not.toHaveBeenCalled();
  });

  it('Given item warnings and failures, When executed, Then completes with warnings and continues', async () => {
    const harness = storeHarness();
    const executor = createFirestoreAdminBatchExecutor({
      store: harness.store,
      workerId: 'test-worker',
      authorize,
      clock: { now: () => now },
      cleanupTerminal: false,
      execute: async (id) => {
        if (id === 'one') return { id, outcome: 'warning' as const };
        throw new Error('failed-item');
      },
    });

    await expect(executor.run(base.batchId, base.principalId)).resolves.toMatchObject({
      status: 'failed',
      warnings: 1,
      failures: 1,
    });
    expect(harness.chunksWritten.at(-1)).toMatchObject({ status: 'failed' });
  });

  it('Given warnings without failures, When executed, Then completes with warnings', async () => {
    const harness = storeHarness();
    const executor = createFirestoreAdminBatchExecutor({
      store: harness.store,
      workerId: 'test-worker',
      authorize,
      clock: { now: () => now },
      cleanupTerminal: false,
      execute: async (id) => ({ id, outcome: 'warning' as const }),
    });

    await expect(executor.run(base.batchId, base.principalId)).resolves.toMatchObject({
      status: 'completed-with-warnings',
      warnings: 2,
    });
  });

  it('Given a non-Error item failure, When executed, Then stores a stable unknown failure', async () => {
    const harness = storeHarness();
    const executor = createFirestoreAdminBatchExecutor({
      store: harness.store,
      workerId: 'test-worker',
      authorize,
      clock: { now: () => now },
      cleanupTerminal: false,
      execute: async () => {
        throw 'failure';
      },
    });

    await expect(executor.run(base.batchId, base.principalId)).resolves.toMatchObject({
      status: 'failed',
      failures: 2,
    });
  });

  it('Given a cancellation request before a chunk, When executed, Then returns cancelled without executing items', async () => {
    const harness = storeHarness();
    harness.setCancellation(true);
    let executions = 0;
    const executor = createFirestoreAdminBatchExecutor({
      store: harness.store,
      workerId: 'test-worker',
      authorize,
      clock: { now: () => now },
      cleanupTerminal: false,
      execute: async (id) => {
        executions += 1;
        return { id, outcome: 'succeeded' };
      },
    });

    await expect(executor.run(base.batchId, base.principalId)).resolves.toMatchObject({
      status: 'cancelled',
    });
    expect(executions).toBe(0);
  });

  it('Given a terminal operation, When executed again, Then returns it without processing', async () => {
    const harness = storeHarness();
    harness.store.claim = async () => ({
      claimed: false,
      record: { ...base, status: 'completed' },
    });
    const executor = createFirestoreAdminBatchExecutor({
      store: harness.store,
      workerId: 'test-worker',
      authorize,
      clock: { now: () => now },
      execute: async (id) => ({ id, outcome: 'succeeded' }),
    });

    await expect(executor.run(base.batchId, base.principalId)).resolves.toMatchObject({
      status: 'completed',
    });
  });

  it('Given no stored operation, When executed, Then reports not found', async () => {
    const harness = storeHarness();
    harness.store.claim = async () => {
      throw { code: 'not-found' };
    };
    const executor = createFirestoreAdminBatchExecutor({
      store: harness.store,
      workerId: 'test-worker',
      authorize,
      clock: { now: () => now },
      execute: async (id) => ({ id, outcome: 'succeeded' }),
    });

    await expect(executor.run(base.batchId, base.principalId)).rejects.toMatchObject({
      code: 'not-found',
    });
  });

  it.each([0, 33, NaN, Infinity, -Infinity])(
    'Given invalid concurrency (%s), When created, Then rejects configuration',
    (concurrency) => {
      const harness = storeHarness();
      expect(() =>
        createFirestoreAdminBatchExecutor({
          store: harness.store,
          workerId: 'test-worker',
          authorize,
          clock: { now: () => now },
          execute: async (id) => ({ id, outcome: 'succeeded' }),
          concurrency,
        }),
      ).toThrow(RangeError);
    },
  );

  it('Given invalid worker identity or lease duration, When created, Then rejects configuration', () => {
    const harness = storeHarness();
    expect(() =>
      createFirestoreAdminBatchExecutor({
        store: harness.store,
        workerId: ' ',
        authorize,
        clock: { now: () => now },
        execute: async (id) => ({ id, outcome: 'succeeded' }),
      }),
    ).toThrow(RangeError);
    expect(() =>
      createFirestoreAdminBatchExecutor({
        store: harness.store,
        workerId: 'worker',
        authorize,
        leaseDurationMilliseconds: 0,
        clock: { now: () => now },
        execute: async (id) => ({ id, outcome: 'succeeded' }),
      }),
    ).toThrow(RangeError);
    expect(() =>
      createFirestoreAdminBatchExecutor({
        store: harness.store,
        workerId: 'worker',
        authorize,
        maxChunks: 0,
        clock: { now: () => now },
        execute: async (id) => ({ id, outcome: 'succeeded' }),
      }),
    ).toThrow(RangeError);
    expect(() =>
      createFirestoreAdminBatchExecutor({
        store: harness.store,
        workerId: 'worker',
        authorize,
        cleanupTerminal: true,
        clock: { now: () => now },
        execute: async (id) => ({ id, outcome: 'succeeded' }),
      }),
    ).toThrow('cleanup capability');
  });

  it('Given more runnable chunks than allowed, When executed, Then rejects without materializing all chunks', async () => {
    const harness = storeHarness([
      {
        chunkId: createEntityId('chunk-1'),
        ids: [createEntityId('one')],
        status: 'pending' as const,
        attempts: 0,
      },
      {
        chunkId: createEntityId('chunk-2'),
        ids: [createEntityId('two')],
        status: 'pending' as const,
        attempts: 0,
      },
    ]);
    const executor = createFirestoreAdminBatchExecutor({
      store: harness.store,
      workerId: 'test-worker',
      authorize,
      maxChunks: 1,
      clock: { now: () => now },
      execute: async (id) => ({ id, outcome: 'succeeded' }),
    });

    await expect(executor.run(base.batchId, base.principalId)).rejects.toThrow(
      'exceeds the 1 chunk limit',
    );
  });

  it('Given no runnable chunks, When executed, Then completes without item execution', async () => {
    const harness = storeHarness([]);
    let removed = false;
    harness.cleanup.remove = async () => {
      removed = true;
    };
    const executor = createFirestoreAdminBatchExecutor({
      store: harness.store,
      workerId: 'test-worker',
      authorize,
      cleanup: harness.cleanup,
      cleanupTerminal: true,
      clock: { now: () => now },
      execute: async (id) => ({ id, outcome: 'succeeded' }),
    });

    await expect(executor.run(base.batchId, base.principalId)).resolves.toMatchObject({
      status: 'completed',
    });
    expect(removed).toBe(true);
  });

  it('Given a previously attempted chunk, When executed, Then counts the retry', async () => {
    const harness = storeHarness([
      {
        chunkId: createEntityId('chunk-1'),
        ids: [createEntityId('one'), createEntityId('two')],
        status: 'pending' as const,
        attempts: 1,
        succeeded: 1,
        warnings: 0,
        failures: 0,
      },
    ]);

    await expect(
      createFirestoreAdminBatchExecutor({
        store: harness.store,
        workerId: 'test-worker',
        authorize,
        clock: { now: () => now },
        cleanupTerminal: false,
        execute: async (id) => ({ id, outcome: 'succeeded' }),
      }).run(base.batchId),
    ).resolves.toMatchObject({ retryCount: 1, processed: 1 });
  });
});
