import { describe, expect, it } from 'vitest';
import { createEntityId } from '@tankos/data-access';
import {
  createFirestoreAdminBatchStoreCancellationOperations,
} from './firestore-admin-batch-store-cancellation-operations';
import { createFirestoreAdminBatchStoreContext } from './firestore-admin-batch-store-context';
import {
  createHarness,
  createSubmissionStore,
  record,
} from './firestore-admin-batch-store-test-harness.spec';

describe('firestore-admin-batch-store-cancellation-operations', () => {
  it('Given a store context, When cancellation operations are created, Then all cancellation capabilities are exposed', () => {
    const { firestore } = createHarness();
    const context = createFirestoreAdminBatchStoreContext(
      firestore as never,
      'batches',
      { now: () => ({ kind: 'instant', epochMilliseconds: 0 }) },
    );
    expect(createFirestoreAdminBatchStoreCancellationOperations(context)).toEqual(
      expect.objectContaining({
        requestCancellation: expect.any(Function),
        isCancellationRequested: expect.any(Function),
        remove: expect.any(Function),
      }),
    );
  });

  it('Given a queued record, When cancellation is requested, Then exposes the cancellation flag', async () => {
    const { firestore } = createHarness();
    const store = createSubmissionStore({
      firestore: firestore as never,
      collectionPath: 'batches',
      clock: { now: () => ({ kind: 'instant', epochMilliseconds: 0 }) },
    });
    await store.create(record(), 'cancellation-test');
    await store.requestCancellation(createEntityId('batch-1'));
    await expect(
      store.isCancellationRequested(createEntityId('batch-1')),
    ).resolves.toBe(true);
  });
});
