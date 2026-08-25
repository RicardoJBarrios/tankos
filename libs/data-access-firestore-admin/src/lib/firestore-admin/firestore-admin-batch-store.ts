import { Timestamp } from 'firebase-admin/firestore';
import { createFirestoreAdminBatchStoreContext } from './firestore-admin-batch-store-context';
import type {
  FirestoreAdminBatchImplementation,
  FirestoreAdminBatchStoreOptions,
  FirestoreAdminBatchStores,
} from './firestore-admin-batch-store-contract';
import { createFirestoreAdminBatchStoreCancellationOperations } from './firestore-admin-batch-store-cancellation-operations';
import { createFirestoreAdminBatchStoreChunksOperations } from './firestore-admin-batch-store-chunks-operations';
import { createFirestoreAdminBatchStoreLeasesOperations } from './firestore-admin-batch-store-leases-operations';
import { createFirestoreAdminBatchStoreSubmissionOperations } from './firestore-admin-batch-store-submission-operations';

export type {
  FirestoreAdminBatchStoreOptions,
  FirestoreAdminBatchStores,
} from './firestore-admin-batch-store-contract';

/** Creates durable batch summaries, chunks, results and idempotency records. */
export function createFirestoreAdminBatchStore<TPayload = unknown>(
  options: FirestoreAdminBatchStoreOptions,
): FirestoreAdminBatchStores<TPayload> {
  const clock = options.clock ?? {
    now: () => ({
      kind: 'instant' as const,
      epochMilliseconds: Timestamp.now().toMillis(),
    }),
  };
  const context = createFirestoreAdminBatchStoreContext(
    options.firestore,
    options.collectionPath,
    clock,
  );
  const implementation = {
    ...createFirestoreAdminBatchStoreSubmissionOperations<TPayload>(context),
    ...createFirestoreAdminBatchStoreLeasesOperations<TPayload>(context),
    ...createFirestoreAdminBatchStoreChunksOperations(context),
    ...createFirestoreAdminBatchStoreCancellationOperations<TPayload>(context),
  } as FirestoreAdminBatchImplementation<TPayload>;
  return createPublicStores(implementation);
}

function createPublicStores<TPayload>(
  implementation: FirestoreAdminBatchImplementation<TPayload>,
): FirestoreAdminBatchStores<TPayload> {
  return {
    submissionStore: {
      create: implementation.create,
      get: implementation.get,
      update: (batchId, patch) => implementation.update(batchId, patch),
      requestCancellation: implementation.requestCancellation,
      isCancellationRequested: implementation.isCancellationRequested,
      remove: implementation.remove,
    },
    materializerStore: {
      get: implementation.get,
      claimMaterialization: implementation.claimMaterialization,
      update: (batchId, patch, lease) =>
        implementation.update(batchId, patch, lease, 'materialization'),
      putChunk: (batchId, chunk, lease) =>
        implementation.putChunk(batchId, chunk, lease, 'materialization'),
      isCancellationRequested: implementation.isCancellationRequested,
    },
    workerStore: {
      get: implementation.get,
      claim: implementation.claim,
      update: (batchId, patch, lease) =>
        implementation.update(batchId, patch, lease),
      putChunk: (batchId, chunk, lease) =>
        implementation.putChunk(batchId, chunk, lease),
      listRunnableChunks: implementation.listRunnableChunks,
      putResults: implementation.putResults,
      isCancellationRequested: implementation.isCancellationRequested,
    },
  };
}
