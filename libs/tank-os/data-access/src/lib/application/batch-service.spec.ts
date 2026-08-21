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
    ids: [createEntityId('unit-1')],
  };
  const progress: BatchProgress = {
    batchId,
    schema: 'units',
    status: 'queued',
    total: 1,
    processed: 0,
    warnings: 0,
    failures: 0,
  };

  it('Given a batch request, When submitted, Then delegates it without waiting for execution details', async () => {
    const calls: unknown[] = [];
    const port: BatchOperationPort = {
      submit: async (value) => {
        calls.push(value);
        return progress;
      },
      get: async () => progress,
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
    };

    await expect(createBatchService(port).get(batchId)).resolves.toBe(progress);
    expect(received).toEqual([batchId]);
  });
});
