import { describe, expect, it } from 'vitest';
import { createEntityId } from '@tankos/data-access';
import { createFirestoreAdminBatchStoreChunksOperations } from './firestore-admin-batch-store-chunks-operations';
import { createFirestoreAdminBatchStoreContext } from './firestore-admin-batch-store-context';
import {
  createHarness,
  createSubmissionStore,
  createWorkerStore,
  leaseOf,
  record,
} from './firestore-admin-batch-store-test-harness.spec';

describe('firestore-admin-batch-store-chunks-operations', () => {
  it('Given a store context, When chunk operations are created, Then all chunk capabilities are exposed', () => {
    const { firestore } = createHarness();
    const context = createFirestoreAdminBatchStoreContext(
      firestore as never,
      'batches',
      { now: () => ({ kind: 'instant', epochMilliseconds: 0 }) },
    );
    expect(createFirestoreAdminBatchStoreChunksOperations(context)).toEqual(
      expect.objectContaining({
        putChunk: expect.any(Function),
        listRunnableChunks: expect.any(Function),
        putResults: expect.any(Function),
      }),
    );
  });

  it('Given a worker lease, When a chunk is stored, Then it is returned as runnable work', async () => {
    const { firestore } = createHarness();
    const options = {
      firestore: firestore as never,
      collectionPath: 'batches',
      clock: { now: () => ({ kind: 'instant', epochMilliseconds: 0 }) },
    };
    await createSubmissionStore(options).create(record(), 'chunks-test');
    const worker = createWorkerStore(options);
    const claim = await worker.claim(createEntityId('batch-1'), {
      ownerId: 'worker-test',
      now: { kind: 'instant', epochMilliseconds: 0 },
      leaseDurationMilliseconds: 1000,
    });
    await worker.putChunk(
      createEntityId('batch-1'),
      {
        chunkId: createEntityId('chunk-1'),
        ids: [createEntityId('item-1')],
        status: 'pending',
        attempts: 0,
      },
      leaseOf(claim),
    );
    await expect(
      worker.listRunnableChunks(createEntityId('batch-1')),
    ).resolves.toMatchObject([{ chunkId: 'chunk-1', ids: ['item-1'] }]);
  });
});
