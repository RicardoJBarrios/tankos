import { createEntityId } from '../core';
import { createAuthorizedBatchWorker } from './batch-worker';

describe('createAuthorizedBatchWorker', () => {
  it('Given a caller, When a batch is run, Then forwards the caller identity to execution', async () => {
    const calls: string[] = [];
    const batchId = createEntityId('batch-1');
    const progress = {
      batchId,
      schema: 'units',
      operation: 'delete' as const,
      status: 'completed' as const,
      total: 1,
      processed: 1,
      warnings: 0,
      failures: 0,
      createdAt: { kind: 'instant' as const, epochMilliseconds: 0 },
      updatedAt: { kind: 'instant' as const, epochMilliseconds: 0 },
      retryCount: 1,
    };
    const worker = createAuthorizedBatchWorker(
      {
        run: async (_batchId, principalId) => {
          calls.push(`run:${principalId}`);
          return progress;
        },
      },
    );

    await expect(
      worker.run(batchId, {
        principalId: createEntityId('administrator'),
        roles: ['administrator'],
      }),
    ).resolves.toBe(progress);
    expect(calls).toEqual(['run:administrator']);
  });

  it('Given an execution boundary, When a batch is run, Then does not invent an authorization result', async () => {
    const run = vi.fn(async () => {
      throw new Error('IAM denied');
    });
    const worker = createAuthorizedBatchWorker(
      { run },
    );

    await expect(
      worker.run(createEntityId('batch-1'), {
        principalId: createEntityId('keeper'),
        roles: ['keeper'],
      }),
    ).rejects.toThrow('IAM denied');
    expect(run).toHaveBeenCalledWith(
      createEntityId('batch-1'),
      createEntityId('keeper'),
    );
  });
});
