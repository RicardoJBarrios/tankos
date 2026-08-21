import { createEntityId } from '../core';
import { createAuthorizedBatchWorker } from './batch-worker';

describe('createAuthorizedBatchWorker', () => {
  it('Given an authorized caller, When a batch is run, Then authorizes before execution', async () => {
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
        authorize: async () => calls.push('authorize'),
      },
      {
        run: async () => {
          calls.push('run');
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
    expect(calls).toEqual(['authorize', 'run']);
  });

  it('Given a rejected caller, When a batch is run, Then does not execute it', async () => {
    const run = vi.fn();
    const worker = createAuthorizedBatchWorker(
      {
        authorize: async () => {
          throw new Error('IAM denied');
        },
      },
      { run },
    );

    await expect(
      worker.run(createEntityId('batch-1'), {
        principalId: createEntityId('keeper'),
        roles: ['keeper'],
      }),
    ).rejects.toThrow('IAM denied');
    expect(run).not.toHaveBeenCalled();
  });
});
