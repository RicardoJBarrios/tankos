import {
  createDataAccessError,
  type BatchOperationRecord,
  type BatchSubmissionStorePort,
  type EntityId,
} from '@tankos/data-access';
import {
  fromDto,
  mapError,
  toDto,
  type BatchDto,
  type FirestoreAdminBatchStoreContext,
} from './firestore-admin-batch-store-context';
import type { Transaction } from 'firebase-admin/firestore';

async function createDurableRecord<TPayload>(
  context: FirestoreAdminBatchStoreContext,
  record: BatchOperationRecord<TPayload>,
  idempotencyKey: string,
  transaction: Transaction,
): Promise<BatchOperationRecord<TPayload>> {
  const operationRef = context.batchReference(record.batchId);
  const keyRef = context.idempotencyReference(
    record.principalId,
    idempotencyKey,
  );
  const existingKey = await transaction.get(keyRef);
  if (existingKey.exists)
    return resolveExistingRecord(
      context,
      record,
      idempotencyKey,
      existingKey.data(),
      transaction,
    );
  if ((await transaction.get(operationRef)).exists)
    throw createDataAccessError('conflict', 'The batch id already exists');
  const dto = toDto(record);
  transaction.create(operationRef, { ...dto, idempotencyKey });
  transaction.create(keyRef, {
    fingerprint: record.requestFingerprint,
    batchId: record.batchId,
    record: {
      ...context.idempotencyProjection({ ...dto, idempotencyKey }),
      idempotencyKey,
    },
    createdAt: context.timestampNow(),
  });
  return record;
}

async function resolveExistingRecord<TPayload>(
  context: FirestoreAdminBatchStoreContext,
  record: BatchOperationRecord<TPayload>,
  idempotencyKey: string,
  value: Record<string, unknown> | undefined,
  transaction: Transaction,
): Promise<BatchOperationRecord<TPayload>> {
  const stored = value as {
    readonly fingerprint: string;
    readonly batchId: string;
    readonly record?: BatchDto;
  };
  if (stored.fingerprint !== record.requestFingerprint)
    throw createDataAccessError(
      'conflict',
      'The batch idempotency key was reused with a different request',
    );
  const current = await transaction.get(
    context.batchReference(stored.batchId as EntityId),
  );
  if (current.exists) return fromDto<TPayload>(current.data());
  if (stored.record) return fromDto<TPayload>(stored.record);
  throw createDataAccessError(
    'not-found',
    `The idempotent batch ${idempotencyKey} no longer exists`,
  );
}

function createCreateOperation<TPayload>(
  context: FirestoreAdminBatchStoreContext,
): BatchSubmissionStorePort<TPayload>['create'] {
  return async (record, idempotencyKey) => {
    try {
      const result = await context.firestore.runTransaction((transaction) =>
        createDurableRecord(context, record, idempotencyKey, transaction),
      );
      return result;
    } catch (error) {
      return mapError(error, 'Firestore Admin batch creation failed');
    }
  };
}

function createGetOperation<TPayload>(
  context: FirestoreAdminBatchStoreContext,
): BatchSubmissionStorePort<TPayload>['get'] {
  return async (batchId) => {
    try {
      const snapshot = await context.batchReference(batchId).get();
      return snapshot.exists
        ? fromDto<TPayload>(snapshot.data())
        : undefined;
    } catch (error) {
      return mapError(error, 'Firestore Admin batch read failed');
    }
  };
}

/** Creates the submission operations for the Admin batch store. */
export function createFirestoreAdminBatchStoreSubmissionOperations<TPayload>(
  context: FirestoreAdminBatchStoreContext,
) {
  return {
    create: createCreateOperation<TPayload>(context),
    get: createGetOperation<TPayload>(context),
  };
}
