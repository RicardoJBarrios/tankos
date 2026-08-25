import type {
  AccessContext,
  CrudRecord,
  ListRequest,
  RecordCommand,
} from '@tankos/data-access';
import {
  createDataAccessError,
  validateLifecycleSelection,
} from '@tankos/data-access';
import type { Timestamp } from 'firebase/firestore';
import { Timestamp as FirestoreTimestamp } from 'firebase/firestore';
import type { Transaction } from 'firebase/firestore';
import * as firestoreSdk from 'firebase/firestore';
import type { ClockPort } from '@tankos/time';
import type { DataAccessErrorCode } from '@tankos/data-access';
import type { FirestoreCrudRepositoryOptions } from './firestore-crud-repository';
import {
  mapRecord,
  timestamp,
  validateDocumentId,
} from './firestore-crud-repository';

/** Applies the host-provided authorization policy to a CRUD operation. */
export async function authorizeFirestoreAccess<
  TData,
  TCreate,
  TUpdate,
  TFilter,
>(
  options: FirestoreCrudRepositoryOptions<TData, TCreate, TUpdate, TFilter>,
  access: AccessContext,
  operation: Parameters<
    NonNullable<
      FirestoreCrudRepositoryOptions<
        TData,
        TCreate,
        TUpdate,
        TFilter
      >['authorize']
    >
  >[1],
  lifecycle?: ListRequest<TFilter>['lifecycle'],
): Promise<void> {
  if (options.authorize) {
    await options.authorize(access, operation, lifecycle);
    return;
  }
  if (isLifecycleMutation(operation))
    throw createDataAccessError(
      'forbidden',
      `Firestore ${operation} requires an authorization policy`,
    );
}

/** Validates lifecycle visibility before delegating the host authorization policy. */
export async function authorizeFirestoreLifecycleRead<
  TData,
  TCreate,
  TUpdate,
  TFilter,
>(
  options: FirestoreCrudRepositoryOptions<TData, TCreate, TUpdate, TFilter>,
  access: AccessContext,
  lifecycle: ListRequest<TFilter>['lifecycle'],
  operation: 'list' | 'get',
): Promise<void> {
  validateLifecycleSelection(lifecycle);
  const hasHiddenLifecycle =
    lifecycle?.some((status) => status !== 'active' && status !== 'inactive') ??
    false;
  if (hasHiddenLifecycle && !options.authorize)
    throw createDataAccessError(
      'forbidden',
      `Firestore ${operation} requires an authorization policy for hidden lifecycle states`,
    );
  await authorizeFirestoreAccess(options, access, operation, lifecycle);
}

function isLifecycleMutation(
  operation:
    'list' | 'get' | 'create' | 'replace' | 'mark' | 'restore' | 'delete',
): boolean {
  return (
    operation === 'mark' || operation === 'restore' || operation === 'delete'
  );
}

/** Enforces optimistic concurrency for a Firestore record command. */
export function requireFirestoreRevision<TData>(
  request: RecordCommand,
  record: CrudRecord<TData>,
): void {
  if (!Number.isInteger(request.expectedRevision))
    throw createDataAccessError(
      'validation',
      'Record commands require an integer expectedRevision',
    );
  if (request.expectedRevision !== record.revision)
    throw createDataAccessError('conflict', 'Record revision is stale');
}

/** Creates the technical timestamp provider used by Firestore metadata. */
export function createFirestoreTimestampFactory(
  clock: ClockPort | undefined,
): () => Timestamp {
  if (!clock) return () => FirestoreTimestamp.now();
  return () => FirestoreTimestamp.fromMillis(clock.now().epochMilliseconds);
}

/** Preserves data-access errors while mapping provider failures. */
export function handleFirestoreError(
  error: unknown,
  fallback: DataAccessErrorCode,
  message: string,
): Error {
  if (error instanceof Error && error.name === 'DataAccessError') return error;
  return createDataAccessError(fallback, message, error);
}

/** Applies terminal deletion checks inside the Firestore transaction. */
export async function deleteFirestoreRecord<TData, TCreate, TUpdate, TFilter>(
  transaction: Transaction,
  request: RecordCommand,
  options: FirestoreCrudRepositoryOptions<TData, TCreate, TUpdate, TFilter>,
): Promise<void> {
  const target = firestoreSdk.doc(
    options.firestore,
    options.collectionPath,
    validateDocumentId(request.id),
  );
  const snapshot = await transaction.get(target);
  if (!snapshot.exists())
    throw createDataAccessError('not-found', 'Record was not found');
  const record = mapRecord(snapshot, options.recordSchema);
  if (record.lifecycle.status !== 'marked-for-deletion')
    throw createDataAccessError(
      'lifecycle',
      'Record must be marked for deletion',
    );
  requireFirestoreRevision(request, record);
  transaction.delete(target);
}

/** Performs a revision-checked transactional update. */
export async function transactFirestoreUpdate<TData, TCreate, TUpdate, TFilter>(
  options: FirestoreCrudRepositoryOptions<TData, TCreate, TUpdate, TFilter>,
  timestampNow: () => Timestamp,
  request: RecordCommand,
  operation: 'replace' | 'mark' | 'restore',
  change: (record: CrudRecord<TData>) => {
    readonly data: TData;
    readonly lifecycle: CrudRecord<TData>['lifecycle'];
  },
): Promise<CrudRecord<TData>> {
  const target = firestoreSdk.doc(
    options.firestore,
    options.collectionPath,
    validateDocumentId(request.id),
  );
  return firestoreSdk.runTransaction(options.firestore, async (transaction) => {
    const current = await transaction.get(target);
    if (!current.exists())
      throw createDataAccessError('not-found', 'Record was not found');
    const record = mapRecord(current, options.recordSchema);
    if (record.lifecycle.status === 'deleted')
      throw createDataAccessError('lifecycle', 'Record is terminally deleted');
    requireFirestoreRevision(request, record);
    const next = change(record);
    const updatedAt = timestampNow();
    const lifecycleChanged = operation === 'mark' || operation === 'restore';
    transaction.update(target, {
      ...next,
      revision: record.revision + 1,
      'metadata.updatedAt': updatedAt,
      'metadata.updatedBy': request.access.principalId,
      ...(lifecycleChanged
        ? {
            'metadata.lifecycleChangedAt': updatedAt,
            'metadata.lifecycleChangedBy': request.access.principalId,
          }
        : {}),
    });
    return {
      ...record,
      data: next.data,
      lifecycle: next.lifecycle,
      revision: record.revision + 1,
      metadata: {
        ...record.metadata,
        updatedAt: timestamp(updatedAt),
        updatedBy: request.access.principalId,
        ...(lifecycleChanged
          ? {
              lifecycleChangedAt: timestamp(updatedAt),
              lifecycleChangedBy: request.access.principalId,
            }
          : {}),
      },
    };
  });
}
