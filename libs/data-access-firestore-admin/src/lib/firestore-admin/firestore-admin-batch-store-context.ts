import {
  DataAccessError,
  createDataAccessError,
  type BatchClaimRequest,
  type BatchLease,
  type BatchOperationRecord,
  type EntityId,
  type TechnicalTimestamp,
} from '@tankos/data-access';
import type { ClockPort } from '@tankos/time';
import {
  Timestamp,
  type CollectionReference,
  type Firestore,
} from 'firebase-admin/firestore';
import { firestoreAdminBatchDtoSchema } from './firestore-admin-schemas';
import type {
  BatchDto,
  BatchPatch,
  FirestoreAdminBatchStoreContext,
  LeaseKind,
} from './firestore-admin-batch-store-contract';
export type {
  BatchDto,
  BatchPatch,
  FirestoreAdminBatchStoreContext,
  LeaseKind,
} from './firestore-admin-batch-store-contract';

/** Converts a domain timestamp into an Admin SDK timestamp. */
export function toTimestamp(value: TechnicalTimestamp): Timestamp {
  return Timestamp.fromMillis(value.epochMilliseconds);
}

/** Converts an Admin SDK timestamp into a technical timestamp. */
export function toTechnicalTimestamp(value: Timestamp): TechnicalTimestamp {
  return { kind: 'instant', epochMilliseconds: value.toMillis() };
}

/** Maps a validated Firestore document into the domain record. */
export function fromDto<TPayload>(
  value: unknown,
): BatchOperationRecord<TPayload> {
  const dto = firestoreAdminBatchDtoSchema.parse(value) as BatchDto;
  return {
    batchId: dto.batchId as never,
    principalId: dto.principalId as never,
    schema: dto.schema,
    operation: dto.operation,
    status: dto.status,
    total: dto.total,
    processed: dto.processed,
    warnings: dto.warnings,
    failures: dto.failures,
    retryCount: dto.retryCount,
    currentChunk: dto.currentChunk as never,
    createdAt: toTechnicalTimestamp(dto.createdAt),
    updatedAt: toTechnicalTimestamp(dto.updatedAt),
    selection: dto.selection,
    requestedSelection: dto.requestedSelection,
    payload: dto.payload as TPayload | undefined,
    requestFingerprint: dto.requestFingerprint,
    leaseOwner: dto.leaseOwner,
    leaseToken: dto.leaseToken,
    leaseUntil: dto.leaseUntil
      ? toTechnicalTimestamp(dto.leaseUntil)
      : undefined,
    materializationLeaseOwner: dto.materializationLeaseOwner,
    materializationLeaseToken: dto.materializationLeaseToken,
    materializationLeaseUntil: dto.materializationLeaseUntil
      ? toTechnicalTimestamp(dto.materializationLeaseUntil)
      : undefined,
  };
}

/** Maps a domain record into the Firestore document representation. */
export function toDto<TPayload>(
  record: BatchOperationRecord<TPayload>,
): BatchDto {
  return {
    batchId: record.batchId,
    principalId: record.principalId,
    schema: record.schema,
    operation: record.operation,
    status: record.status,
    total: record.total,
    processed: record.processed,
    warnings: record.warnings,
    failures: record.failures,
    retryCount: record.retryCount,
    currentChunk: record.currentChunk,
    createdAt: toTimestamp(record.createdAt),
    updatedAt: toTimestamp(record.updatedAt),
    selection: record.selection,
    requestedSelection: record.requestedSelection,
    payload: record.payload,
    requestFingerprint: record.requestFingerprint,
    leaseOwner: record.leaseOwner,
    leaseToken: record.leaseToken,
    leaseUntil: record.leaseUntil ? toTimestamp(record.leaseUntil) : undefined,
    materializationLeaseOwner: record.materializationLeaseOwner,
    materializationLeaseToken: record.materializationLeaseToken,
    materializationLeaseUntil: record.materializationLeaseUntil
      ? toTimestamp(record.materializationLeaseUntil)
      : undefined,
  };
}

/** Converts Firestore failures into the data-access error contract. */
export function mapError(error: unknown, message: string): never {
  if (error instanceof DataAccessError) throw error;
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { readonly code: unknown }).code)
      : undefined;
  throw createDataAccessError(mapFirestoreCode(code), message, error);
}

function mapFirestoreCode(code: string | undefined) {
  if (code === 'permission-denied') return 'forbidden' as const;
  if (code === 'not-found') return 'not-found' as const;
  if (code === 'already-exists') return 'conflict' as const;
  if (code === 'invalid-argument') return 'validation' as const;
  return 'transient' as const;
}

/** Validates the identity and duration before attempting a lease transaction. */
export function validateClaimRequest(
  request: BatchClaimRequest,
  subject: 'worker' | 'materializer',
): void {
  const invalid =
    typeof request.ownerId !== 'string' ||
    !request.ownerId.trim() ||
    !Number.isInteger(request.leaseDurationMilliseconds) ||
    request.leaseDurationMilliseconds < 1;
  if (invalid)
    throw createDataAccessError(
      'validation',
      `${subject === 'worker' ? 'Batch worker' : 'Materializer'} identity and lease duration are invalid`,
    );
}

/** Produces the record fields that remain after a lease patch. */
export function updatedLeaseFields(current: BatchDto, patch: BatchPatch) {
  const leaseUntil = 'leaseUntil' in patch ? patch.leaseUntil : undefined;
  const materializationLeaseUntil =
    'materializationLeaseUntil' in patch
      ? patch.materializationLeaseUntil
      : undefined;
  let normalizedLeaseUntil = current.leaseUntil;
  if (leaseUntil === null) normalizedLeaseUntil = undefined;
  if (leaseUntil !== undefined && leaseUntil !== null)
    normalizedLeaseUntil = toTimestamp(leaseUntil);
  return {
    leaseUntil: normalizedLeaseUntil,
    leaseToken: leaseUntil === null ? undefined : current.leaseToken,
    materializationLeaseToken:
      materializationLeaseUntil === null
        ? undefined
        : current.materializationLeaseToken,
  };
}

function createReferences(firestore: Firestore, collectionPath: string) {
  const root = firestore.collection(collectionPath);
  const idempotency = firestore.collection(`${collectionPath}__idempotency`);
  return {
    root,
    idempotency,
    batchReference: (id: EntityId) => root.doc(id),
    idempotencyReference: (principalId: EntityId, key: string) =>
      idempotency.doc(encodeURIComponent(`${principalId}\u0000${key}`)),
  };
}

function createLeaseGuard(timestampNow: () => Timestamp) {
  return (current: BatchDto, lease: BatchLease, kind: LeaseKind): void => {
    const owner =
      kind === 'worker'
        ? current.leaseOwner
        : current.materializationLeaseOwner;
    const token =
      kind === 'worker'
        ? current.leaseToken
        : current.materializationLeaseToken;
    const until =
      kind === 'worker'
        ? current.leaseUntil
        : current.materializationLeaseUntil;
    if (
      owner !== lease.owner ||
      token !== lease.token ||
      !until ||
      until.toMillis() <= timestampNow().toMillis()
    )
      throw createDataAccessError(
        'conflict',
        `The batch ${kind} lease is no longer valid`,
      );
  };
}

function createPatchEncoder() {
  return (patch: BatchPatch): Record<string, unknown> => {
    const encoded: Record<string, unknown> = {
      updatedAt: toTimestamp(patch.updatedAt),
    };
    Object.entries(patch).forEach(([key, value]) => {
      if (key !== 'updatedAt' && value !== undefined) encoded[key] = value;
    });
    encodeLeaseField(encoded, patch, 'leaseUntil', 'leaseToken');
    encodeLeaseField(
      encoded,
      patch,
      'materializationLeaseUntil',
      'materializationLeaseToken',
    );
    return encoded;
  };
}

function encodeLeaseField(
  encoded: Record<string, unknown>,
  patch: BatchPatch,
  key: 'leaseUntil' | 'materializationLeaseUntil',
  tokenKey: 'leaseToken' | 'materializationLeaseToken',
): void {
  const leasePatch = patch as Partial<
    Record<
      'leaseUntil' | 'materializationLeaseUntil',
      TechnicalTimestamp | null
    >
  >;
  if (!(key in leasePatch) || leasePatch[key] === undefined) return;
  const value = leasePatch[key];
  encoded[key] = value ? toTimestamp(value) : null;
  if (value === null) encoded[tokenKey] = null;
}

function createRemover(firestore: Firestore) {
  return async (collection: CollectionReference): Promise<void> => {
    while (true) {
      const page = await collection.limit(400).get();
      if (page.empty) return;
      const batch = firestore.batch();
      page.docs.forEach((item) => batch.delete(item.ref));
      await batch.commit();
      if (page.size < 400) return;
    }
  };
}

function timestampNow(clock: ClockPort): Timestamp {
  return Timestamp.fromMillis(clock.now().epochMilliseconds);
}

function createTimestampNow(clock: ClockPort): () => Timestamp {
  return () => timestampNow(clock);
}

/** Creates the shared context used by every Admin batch capability. */
export function createFirestoreAdminBatchStoreContext(
  firestore: Firestore,
  collectionPath: string,
  clock: ClockPort,
): FirestoreAdminBatchStoreContext {
  const now = createTimestampNow(clock);
  const references = createReferences(firestore, collectionPath);
  return {
    firestore,
    timestampNow: now,
    batchReference: references.batchReference,
    idempotencyReference: references.idempotencyReference,
    chunkReference: (batchId, chunkId) =>
      references.batchReference(batchId).collection('chunks').doc(chunkId),
    resultReference: (batchId, chunkId, itemId) =>
      references
        .batchReference(batchId)
        .collection('results')
        .doc(`${chunkId}:${itemId}`),
    requireLease: createLeaseGuard(now),
    encodePatch: createPatchEncoder(),
    idempotencyProjection: (dto) => ({
      ...dto,
      requestedSelection: undefined,
      payload: undefined,
    }),
    removeDetails: createRemover(firestore),
  };
}
