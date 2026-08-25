import { describe, expect, it } from 'vitest';
import { createEntityId, type BatchOperationRecord } from '@tankos/data-access';
import { createFirestoreAdminBatchStoreContext } from './firestore-admin-batch-store-context';
import { createFirestoreAdminBatchStoreLeasesOperations } from './firestore-admin-batch-store-leases-operations';
import {
  createHarness,
  createMaterializerStore,
  createSubmissionStore,
  createWorkerStore,
  leaseOf,
  record,
} from './firestore-admin-batch-store-test-harness.spec';

describe('firestore-admin-batch-store-leases-operations', () => {
  it('Given a store context, When lease operations are created, Then all lease capabilities are exposed', () => {
    const { firestore } = createHarness();
    const context = createFirestoreAdminBatchStoreContext(
      firestore as never,
      'batches',
      { now: () => ({ kind: 'instant', epochMilliseconds: 0 }) },
    );
    expect(createFirestoreAdminBatchStoreLeasesOperations(context)).toEqual(
      expect.objectContaining({
        claimMaterialization: expect.any(Function),
        claim: expect.any(Function),
        update: expect.any(Function),
      }),
    );
  });

  it('Given a queued record, When claimed by a worker, Then returns a fencing lease', async () => {
    const { firestore } = createHarness();
    const submission = createSubmissionStore({
      firestore: firestore as never,
      collectionPath: 'batches',
      clock: { now: () => ({ kind: 'instant', epochMilliseconds: 0 }) },
    });
    await submission.create(record(), 'leases-test');
    const worker = createWorkerStore({
      firestore: firestore as never,
      collectionPath: 'batches',
      clock: { now: () => ({ kind: 'instant', epochMilliseconds: 0 }) },
    });
    const claim = await worker.claim(createEntityId('batch-1'), {
      ownerId: 'worker-test',
      now: { kind: 'instant', epochMilliseconds: 0 },
      leaseDurationMilliseconds: 1000,
    });
    expect(claim.claimed).toBe(true);
    expect(leaseOf(claim).owner).toBe('worker-test');
  });

  it('Given a materializing record, When claimed by a materializer, Then returns a materialization lease', async () => {
    const { firestore } = createHarness();
    const materializer = createMaterializerStore({
      firestore: firestore as never,
      collectionPath: 'batches',
      clock: { now: () => ({ kind: 'instant', epochMilliseconds: 0 }) },
    });
    const materializing = {
      ...record(),
      status: 'materializing',
    } satisfies BatchOperationRecord<{ label: string }>;
    const submission = createSubmissionStore({
      firestore: firestore as never,
      collectionPath: 'batches',
      clock: { now: () => ({ kind: 'instant', epochMilliseconds: 0 }) },
    });
    await submission.create(materializing, 'materializer-test');
    const claim = await materializer.claimMaterialization(
      createEntityId('batch-1'),
      {
        ownerId: 'materializer-test',
        now: { kind: 'instant', epochMilliseconds: 0 },
        leaseDurationMilliseconds: 1000,
      },
    );
    expect(claim.claimed).toBe(true);
    expect(claim.lease?.owner).toBe('materializer-test');
  });
});
