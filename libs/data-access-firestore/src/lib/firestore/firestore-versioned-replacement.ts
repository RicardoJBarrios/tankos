import * as firestoreSdk from 'firebase/firestore';
import type { Transaction } from 'firebase/firestore';
import type { CrudRecord, EntityId, RecordCommand } from '@tankos/data-access';
import { createDataAccessError, type AccessContext } from '@tankos/data-access';
import type {
  FirestoreCrudRepositoryOptions,
  FirestoreRecordDto,
} from './firestore-crud-repository';
import {
  firestoreErrorCode,
  mapRecord,
  timestamp,
} from './firestore-crud-repository';
import { handleFirestoreError } from './firestore-crud-repository-policy';

async function replaceInTransaction<TData, TCreate, TUpdate, TFilter>(
  transaction: Transaction,
  options: FirestoreCrudRepositoryOptions<TData, TCreate, TUpdate, TFilter>,
  schemaVersion: number,
  currentReference: ReturnType<typeof firestoreSdk.doc>,
  replacementReference: ReturnType<typeof firestoreSdk.doc>,
  request: RecordCommand,
  input: TUpdate,
  access: AccessContext,
  updatedAt: firestoreSdk.Timestamp,
): Promise<CrudRecord<TData>> {
  const currentSnapshot = await transaction.get(currentReference);
  if (!currentSnapshot.exists())
    throw createDataAccessError('not-found', 'Record not found');
  const current = mapRecord(currentSnapshot, options.recordSchema);
  if (current.revision !== request.expectedRevision)
    throw createDataAccessError('conflict', 'Revision conflict');
  if ((await transaction.get(replacementReference)).exists())
    throw createDataAccessError('conflict', 'Replacement already exists');

  const replacement: FirestoreRecordDto<TData> = {
    data: options.updateData(current.data, input, replacementReference.id),
    lifecycle: { status: 'active' },
    revision: 1,
    metadata: {
      schemaVersion,
      createdAt: updatedAt,
      updatedAt,
      createdBy: access.principalId,
      updatedBy: access.principalId,
    },
  };
  transaction.set(replacementReference, replacement);
  transaction.update(currentReference, {
    lifecycle: { status: 'marked-for-deletion' },
    revision: request.expectedRevision + 1,
    'metadata.updatedAt': updatedAt,
    'metadata.updatedBy': access.principalId,
    'metadata.lifecycleChangedAt': updatedAt,
    'metadata.lifecycleChangedBy': access.principalId,
  });
  return {
    id: replacementReference.id as unknown as EntityId,
    data: replacement.data,
    lifecycle: replacement.lifecycle,
    revision: replacement.revision,
    metadata: {
      schemaVersion: replacement.metadata.schemaVersion,
      createdAt: timestamp(updatedAt),
      updatedAt: timestamp(updatedAt),
      createdBy: access.principalId,
      updatedBy: access.principalId,
    },
  } satisfies CrudRecord<TData>;
}

export async function replaceVersionedFirestoreRecord<
  TData,
  TCreate,
  TUpdate,
  TFilter,
>(
  options: FirestoreCrudRepositoryOptions<TData, TCreate, TUpdate, TFilter>,
  timestampNow: () => firestoreSdk.Timestamp,
  schemaVersion: number,
  recordReference: (id: string) => ReturnType<typeof firestoreSdk.doc>,
  request: RecordCommand,
  input: TUpdate,
  access: AccessContext,
): Promise<CrudRecord<TData>> {
  const currentReference = recordReference(request.id);
  const replacementId = (
    options.createReplacementId ??
    ((value: TUpdate, replacementAccess: AccessContext) =>
      options.createId(value as unknown as TCreate, replacementAccess))
  )(input, {
    ...access,
    requestId: `${request.id}:replacement:${String(request.expectedRevision)}`,
  });
  const replacementReference = recordReference(replacementId);
  const updatedAt = timestampNow();

  try {
    return await firestoreSdk.runTransaction(options.firestore, (transaction) =>
      replaceInTransaction(
        transaction,
        options,
        schemaVersion,
        currentReference,
        replacementReference,
        request,
        input,
        access,
        updatedAt,
      ),
    );
  } catch (error) {
    throw handleFirestoreError(
      error,
      firestoreErrorCode(error) ?? 'transient',
      'Firestore versioned replacement failed',
    );
  }
}
