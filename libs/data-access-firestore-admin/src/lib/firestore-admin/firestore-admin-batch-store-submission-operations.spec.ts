import { describe, expect, it } from 'vitest';
import {
  createFirestoreAdminBatchStoreSubmissionOperations,
} from './firestore-admin-batch-store-submission-operations';
import { createFirestoreAdminBatchStoreContext } from './firestore-admin-batch-store-context';
import {
  createSubmissionStore,
  createHarness,
  record,
} from './firestore-admin-batch-store-test-harness.spec';

describe('firestore-admin-batch-store-submission-operations', () => {
  it('Given a store context, When submission operations are created, Then create and get capabilities are exposed', () => {
    const { firestore } = createHarness();
    const context = createFirestoreAdminBatchStoreContext(
      firestore as never,
      'batches',
      { now: () => ({ kind: 'instant', epochMilliseconds: 0 }) },
    );
    expect(createFirestoreAdminBatchStoreSubmissionOperations(context)).toEqual(
      expect.objectContaining({
        create: expect.any(Function),
        get: expect.any(Function),
      }),
    );
  });

  it('Given a new record, When submitted, Then persists and can be read through the submission capability', async () => {
    const { firestore } = createHarness();
    const store = createSubmissionStore({
      firestore: firestore as never,
      collectionPath: 'batches',
      clock: { now: () => ({ kind: 'instant', epochMilliseconds: 0 }) },
    });

    await expect(
      store.create(record(), 'operations-test'),
    ).resolves.toMatchObject({
      batchId: 'batch-1',
    });
    await expect(store.get(record().batchId)).resolves.toMatchObject({
      schema: 'units',
    });
  });
});
