import {
  createDataAccessError,
  type BatchSubmissionStorePort,
  type EntityId,
} from '@tankos/data-access';
import {
  fromDto,
  mapError,
  type BatchDto,
  type FirestoreAdminBatchStoreContext,
} from './firestore-admin-batch-store-context';

function createRequestCancellationOperation<TPayload>(
  context: FirestoreAdminBatchStoreContext,
): BatchSubmissionStorePort<TPayload>['requestCancellation'] {
  return async (batchId) => {
    try {
      const reference = context.batchReference(batchId);
      return await context.firestore.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(reference);
        if (!snapshot.exists)
          throw createDataAccessError('not-found', 'Batch was not found');
        const current = snapshot.data() as BatchDto;
        const terminal =
          current.status === 'completed' ||
          current.status === 'completed-with-warnings' ||
          current.status === 'failed' ||
          current.status === 'cancelled';
        if (terminal) return fromDto<TPayload>(current);
        const updatedAt = context.timestampNow();
        transaction.update(reference, {
          cancellationRequested: true,
          updatedAt,
        });
        return fromDto<TPayload>({
          ...current,
          cancellationRequested: true,
          updatedAt,
        });
      });
    } catch (error) {
      return mapError(error, 'Firestore Admin batch cancellation failed');
    }
  };
}

function createIsCancellationRequestedOperation<TPayload>(
  context: FirestoreAdminBatchStoreContext,
): BatchSubmissionStorePort<TPayload>['isCancellationRequested'] {
  return async (batchId) => {
    try {
      const snapshot = await context.batchReference(batchId).get();
      if (!snapshot.exists)
        throw createDataAccessError('not-found', 'Batch was not found');
      return Boolean(snapshot.data()?.['cancellationRequested']);
    } catch (error) {
      return mapError(error, 'Firestore Admin batch cancellation read failed');
    }
  };
}

function createRemoveOperation<TPayload>(
  context: FirestoreAdminBatchStoreContext,
): BatchSubmissionStorePort<TPayload>['remove'] {
  return async (batchId) => {
    try {
      const reference = context.batchReference(batchId);
      const snapshot = await reference.get();
      if (!snapshot.exists)
        throw createDataAccessError('not-found', 'Batch was not found');
      const dto = snapshot.data() as BatchDto;
      await context.removeDetails(reference.collection('chunks'));
      await context.removeDetails(reference.collection('results'));
      const finalBatch = context.firestore.batch();
      if (dto.idempotencyKey) {
        finalBatch.update(
          context.idempotencyReference(
            dto.principalId as EntityId,
            dto.idempotencyKey,
          ),
          { record: context.idempotencyProjection(dto) },
        );
      }
      finalBatch.delete(reference);
      await finalBatch.commit();
    } catch (error) {
      return mapError(error, 'Firestore Admin batch removal failed');
    }
  };
}

/** Creates the cancellation operations for the Admin batch store. */
export function createFirestoreAdminBatchStoreCancellationOperations<TPayload>(
  context: FirestoreAdminBatchStoreContext,
) {
  return {
    requestCancellation: createRequestCancellationOperation<TPayload>(context),
    isCancellationRequested:
      createIsCancellationRequestedOperation<TPayload>(context),
    remove: createRemoveOperation<TPayload>(context),
  };
}
