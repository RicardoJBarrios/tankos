import { createEntityId } from '../../core';
import { createInMemoryBatchOperation } from './memory-batch-operation';

describe('createInMemoryBatchOperation', () => {
  const now = { kind: 'instant' as const, epochMilliseconds: 0 };
  const ids = [
    createEntityId('one'),
    createEntityId('two'),
    createEntityId('three'),
  ];
  const request = {
    access: {
      principalId: createEntityId('keeper'),
      roles: ['keeper'] as const,
    },
    schema: 'units',
    operation: 'update' as const,
    selection: { kind: 'ids' as const, ids },
    confirmationToken: 'confirmed',
    idempotencyKey: 'memory-batch-test',
  };
  const worker = {
    principalId: createEntityId('worker'),
    roles: ['worker'] as const,
  };

  it('Given a confirmed scope, When submitted and materialized, Then returns queued progress', async () => {
    const adapter = createInMemoryBatchOperation({
      now: () => now,
      materialize: (selection) =>
        selection.kind === 'ids' ? selection.ids : [],
      execute: async (id) => ({ id, outcome: 'succeeded' }),
      chunkSize: 2,
    });

    const progress = await adapter.submit(request);
    const queued = await adapter.materialize(progress.batchId);
    expect(queued).toMatchObject({
      status: 'queued',
      total: 3,
      processed: 0,
    });
    expect(await adapter.get(progress.batchId)).toMatchObject({ total: 3 });
  });

  it('Given a frozen scope, When the worker runs it, Then processes bounded chunks and cleans the terminal operation', async () => {
    const processed: string[] = [];
    const adapter = createInMemoryBatchOperation({
      now: () => now,
      materialize: () => ids,
      execute: async (id) => {
        processed.push(id);
        return { id, outcome: 'succeeded' };
      },
      chunkSize: 2,
    });
    const queued = await adapter.submit(request);
    await adapter.materialize(queued.batchId);

    await expect(adapter.run(queued.batchId, worker)).resolves.toMatchObject({
      status: 'completed',
      processed: 3,
      retryCount: 2,
      currentChunk: 'chunk-2',
    });
    expect(processed).toEqual(['one', 'two', 'three']);
    await expect(adapter.get(queued.batchId)).resolves.toMatchObject({ status: 'completed' });
  });

  it('Given item warnings and failures, When the worker runs, Then completes with warnings and continues', async () => {
    const adapter = createInMemoryBatchOperation({
      now: () => now,
      materialize: () => ids,
      execute: async (id) => {
        if (id === 'one') return { id, outcome: 'warning' };
        if (id === 'two') throw new Error('gone');
        return { id, outcome: 'succeeded' };
      },
    });
    const queued = await adapter.submit(request);
    await adapter.materialize(queued.batchId);

    await expect(adapter.run(queued.batchId, worker)).resolves.toMatchObject({
      status: 'failed',
      warnings: 1,
      failures: 1,
      processed: 3,
    });
  });

  it('Given a non-Error item failure, When the worker runs, Then records a stable unknown failure', async () => {
    const adapter = createInMemoryBatchOperation({
      now: () => now,
      materialize: () => [ids[0]],
      execute: async () => {
        throw 'failure';
      },
    });
    const queued = await adapter.submit(request);
    await adapter.materialize(queued.batchId);

    await expect(adapter.run(queued.batchId, worker)).resolves.toMatchObject({
      status: 'failed',
      failures: 1,
    });
  });

  it('Given a directly rejected item promise, When the worker runs, Then normalizes the Error failure', async () => {
    const adapter = createInMemoryBatchOperation({
      now: () => now,
      materialize: () => [ids[0]],
      execute: () => Promise.reject(new Error('direct-failure')),
    });
    const queued = await adapter.submit(request);
    await adapter.materialize(queued.batchId);

    await expect(adapter.run(queued.batchId, worker)).resolves.toMatchObject({
      status: 'failed',
      failures: 1,
    });
  });

  it('Given a queued batch, When resumed or cancelled, Then updates its durable state', async () => {
    const adapter = createInMemoryBatchOperation({
      now: () => now,
      materialize: () => ids,
      execute: async (id) => ({ id, outcome: 'succeeded' }),
    });
    const resumed = await adapter.submit(request);
    await adapter.materialize(resumed.batchId);
    expect(await adapter.resume(resumed.batchId)).toMatchObject({
      status: 'queued',
    });
    const cancelled = await adapter.submit(request);
    await adapter.materialize(cancelled.batchId);
    expect(await adapter.cancel(cancelled.batchId)).toMatchObject({
      status: 'cancelled',
    });
    await expect(adapter.get(cancelled.batchId)).resolves.toMatchObject({ status: 'cancelled' });
  });

  it('Given an unknown batch or invalid chunk size, When operated, Then returns a typed error', async () => {
    expect(() =>
      createInMemoryBatchOperation({
        now: () => now,
        materialize: () => ids,
        execute: async (id) => ({ id, outcome: 'succeeded' }),
        chunkSize: 401,
      }),
    ).toThrow(RangeError);
    const adapter = createInMemoryBatchOperation({
      now: () => now,
      materialize: () => ids,
      execute: async (id) => ({ id, outcome: 'succeeded' }),
    });
    await expect(
      adapter.get(createEntityId('missing')),
    ).resolves.toBeUndefined();
    await expect(
      adapter.resume(createEntityId('missing')),
    ).rejects.toMatchObject({
      code: 'not-found',
    });
    await expect(
      adapter.cancel(createEntityId('missing')),
    ).rejects.toMatchObject({
      code: 'not-found',
    });
    await expect(
      adapter.run(createEntityId('missing'), worker),
    ).rejects.toMatchObject({
      code: 'not-found',
    });
    await expect(
      adapter.resume(createEntityId('missing')),
    ).rejects.toMatchObject({
      code: 'not-found',
    });
  });

  it('Given an invalid concurrency, When the adapter is created, Then rejects the configuration', () => {
    expect(() =>
      createInMemoryBatchOperation({
        now: () => now,
        materialize: () => ids,
        execute: async (id) => ({ id, outcome: 'succeeded' }),
        concurrency: 33,
      }),
    ).toThrow(RangeError);
  });

  it('Given a concurrency limit, When a chunk runs, Then never exceeds that limit', async () => {
    let active = 0;
    let maximum = 0;
    const adapter = createInMemoryBatchOperation({
      now: () => now,
      materialize: () => ids,
      concurrency: 1,
      execute: async (id) => {
        active += 1;
        maximum = Math.max(maximum, active);
        await Promise.resolve();
        active -= 1;
        return { id, outcome: 'succeeded' as const };
      },
    });
    const queued = await adapter.submit(request);
    await adapter.materialize(queued.batchId);

    await adapter.run(queued.batchId, worker);

    expect(maximum).toBe(1);
  });

  it('Given a keeper caller, When it tries to execute a batch, Then rejects before execution', async () => {
    const adapter = createInMemoryBatchOperation({
      now: () => now,
      materialize: () => ids,
      execute: async (id) => ({ id, outcome: 'succeeded' as const }),
    });
    const queued = await adapter.submit(request);
    await adapter.materialize(queued.batchId);

    await expect(
      adapter.run(queued.batchId, request.access),
    ).rejects.toMatchObject({
      code: 'forbidden',
    });
  });

  it('Given the same idempotency key, When submitted twice, Then materializes and stores one operation', async () => {
    let materializations = 0;
    const adapter = createInMemoryBatchOperation({
      now: () => now,
      materialize: () => {
        materializations += 1;
        return ids;
      },
      execute: async (id) => ({ id, outcome: 'succeeded' as const }),
    });

    const first = await adapter.submit(request);
    await adapter.materialize(first.batchId);
    const second = await adapter.submit(request);
    expect(second.batchId).toBe(first.batchId);
    expect(materializations).toBe(1);
  });

  it('Given a reused idempotency key with a different request, When submitted, Then rejects the conflict', async () => {
    const adapter = createInMemoryBatchOperation({
      now: () => now,
      materialize: () => ids,
      execute: async (id) => ({ id, outcome: 'succeeded' as const }),
    });

    const submitted = await adapter.submit(request);
    await adapter.materialize(submitted.batchId);

    await expect(
      adapter.submit({
        ...request,
        operation: 'delete',
      }),
    ).rejects.toMatchObject({ code: 'conflict' });
  });

  it('Given a confirmed filter with no matches, When the worker runs it, Then completes without execution chunks', async () => {
    const adapter = createInMemoryBatchOperation({
      now: () => now,
      materialize: () => [],
      execute: async (id) => ({ id, outcome: 'succeeded' }),
    });
    const queued = await adapter.submit({
      ...request,
      selection: { kind: 'filter', filter: { name: 'missing' } },
    });
    await adapter.materialize(queued.batchId);

    await expect(adapter.run(queued.batchId, worker)).resolves.toMatchObject({
      status: 'completed',
      total: 0,
      processed: 0,
    });
  });
});
