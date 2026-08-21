import {
  createEntityId,
  type BatchOperationPort,
  type BatchProgress,
  type BatchRequest,
  type EntityId,
} from '../core';
import { createBatchService } from './batch-service';

describe('createBatchService', () => {
  const batchId = createEntityId('batch-1');
  const request: BatchRequest = {
    schema: 'units',
    operation: 'mark-for-deletion',
    selection: { kind: 'ids', ids: [createEntityId('unit-1')] },
    confirmationToken: 'confirmed-by-test',
  };
  const progress: BatchProgress = {
    batchId,
    schema: 'units',
    operation: 'mark-for-deletion',
    status: 'queued',
    total: 1,
    processed: 0,
    warnings: 0,
    failures: 0,
    createdAt: { kind: 'instant', epochMilliseconds: 0 },
    updatedAt: { kind: 'instant', epochMilliseconds: 0 },
    retryCount: 0,
  };

  it('Given a batch request, When submitted, Then delegates it without waiting for execution details', async () => {
    const calls: unknown[] = [];
    const port: BatchOperationPort = {
      submit: async (value) => {
        calls.push(value);
        return progress;
      },
      get: async () => progress,
      resume: async () => progress,
      cancel: async () => progress,
    };

    await expect(createBatchService(port).submit(request)).resolves.toBe(
      progress,
    );
    expect(calls).toEqual([request]);
  });

  it('Given a batch identifier, When progress is requested, Then delegates the identifier', async () => {
    const received: EntityId[] = [];
    const port: BatchOperationPort = {
      submit: async () => progress,
      get: async (id) => {
        received.push(id);
        return progress;
      },
      resume: async () => progress,
      cancel: async () => progress,
    };

    await expect(createBatchService(port).get(batchId)).resolves.toBe(progress);
    expect(received).toEqual([batchId]);
  });

  it('Given an interrupted batch, When resumed or cancelled, Then delegates both lifecycle commands', async () => {
    const calls: string[] = [];
    const port: BatchOperationPort = {
      submit: async () => progress,
      get: async () => progress,
      resume: async (id) => {
        calls.push(`resume:${id}`);
        return progress;
      },
      cancel: async (id) => {
        calls.push(`cancel:${id}`);
        return progress;
      },
    };
    const service = createBatchService(port);

    await service.resume(batchId);
    await service.cancel(batchId);
    expect(calls).toEqual(['resume:batch-1', 'cancel:batch-1']);
  });

  it('Given an unconfirmed batch, When submitted through the application service, Then rejects before reaching the execution port', async () => {
    const port: BatchOperationPort = {
      submit: async () => progress,
      get: async () => progress,
      resume: async () => progress,
      cancel: async () => progress,
    };

    await expect(
      createBatchService(port).submit({
        ...request,
        confirmationToken: ' ',
      }),
    ).rejects.toThrow(TypeError);
  });
});
