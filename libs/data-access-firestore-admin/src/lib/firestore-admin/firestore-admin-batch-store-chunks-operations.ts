import {
  createDataAccessError,
  createEntityId,
  type BatchChunk,
  type BatchLease,
  type BatchWorkerStorePort,
} from '@tankos/data-access';
import { firestoreAdminBatchChunkSchema } from './firestore-admin-schemas';
import {
  mapError,
  type BatchDto,
  type FirestoreAdminBatchStoreContext,
  type LeaseKind,
} from './firestore-admin-batch-store-context';

function createPutChunkOperation<TPayload>(
  context: FirestoreAdminBatchStoreContext,
): BatchWorkerStorePort<TPayload>['putChunk'] {
  return async (batchId, chunk, lease, leaseKind: LeaseKind = 'worker') => {
    try {
      await context.firestore.runTransaction(async (transaction) => {
        const batchSnapshot = await transaction.get(
          context.batchReference(batchId),
        );
        if (!batchSnapshot.exists)
          throw createDataAccessError('not-found', 'Batch was not found');
        context.requireLease(
          batchSnapshot.data() as BatchDto,
          lease,
          leaseKind,
        );
        transaction.set(context.chunkReference(batchId, chunk.chunkId), chunk);
      });
    } catch (error) {
      return mapError(error, 'Firestore Admin batch chunk write failed');
    }
  };
}

function createListRunnableChunksOperation<TPayload>(
  context: FirestoreAdminBatchStoreContext,
): BatchWorkerStorePort<TPayload>['listRunnableChunks'] {
  return async (batchId, limit) => {
    try {
      const query = context
        .batchReference(batchId)
        .collection('chunks')
        .where('status', 'in', ['pending', 'failed']);
      const result = await (
        limit === undefined ? query : query.limit(limit)
      ).get();
      return result.docs.map((item) => {
        const parsed = firestoreAdminBatchChunkSchema.parse(item.data());
        return {
          ...parsed,
          chunkId: createEntityId(parsed.chunkId),
          ids: parsed.ids.map((id) => createEntityId(id)),
        } satisfies BatchChunk;
      });
    } catch (error) {
      return mapError(error, 'Firestore Admin batch chunk read failed');
    }
  };
}

function createPutResultsOperation<TPayload>(
  context: FirestoreAdminBatchStoreContext,
): BatchWorkerStorePort<TPayload>['putResults'] {
  return async (batchId, chunkId, results, lease: BatchLease) => {
    try {
      await context.firestore.runTransaction(async (transaction) => {
        const batchSnapshot = await transaction.get(
          context.batchReference(batchId),
        );
        if (!batchSnapshot.exists)
          throw createDataAccessError('not-found', 'Batch was not found');
        context.requireLease(batchSnapshot.data() as BatchDto, lease, 'worker');
        for (const result of results) {
          transaction.set(
            context.resultReference(batchId, chunkId, result.id),
            {
              ...result,
              chunkId,
              completedAt: context.timestampNow(),
            },
          );
        }
      });
    } catch (error) {
      return mapError(error, 'Firestore Admin batch result write failed');
    }
  };
}

/** Creates the chunks operations for the Admin batch store. */
export function createFirestoreAdminBatchStoreChunksOperations<TPayload>(
  context: FirestoreAdminBatchStoreContext,
) {
  return {
    putChunk: createPutChunkOperation<TPayload>(context),
    listRunnableChunks: createListRunnableChunksOperation<TPayload>(context),
    putResults: createPutResultsOperation<TPayload>(context),
  };
}
