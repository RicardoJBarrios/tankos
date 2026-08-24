import {
  DataAccessError,
  createDataAccessError,
  type BatchItemResult,
  type BatchClaim,
  type BatchClaimRequest,
  type BatchMaterializerPatch,
  type BatchMaterializerStorePort,
  type BatchChunk,
  type BatchLease,
  type BatchOperationRecord,
  type BatchSubmissionPatch,
  type BatchSubmissionStorePort,
  type BatchWorkerPatch,
  type BatchWorkerStorePort,
  type EntityId,
  type TechnicalTimestamp,
  createEntityId,
} from '@tankos/data-access';
import type { ClockPort } from '@tankos/time';
import {
  Timestamp,
  type CollectionReference,
  type DocumentData,
  type Firestore,
} from 'firebase-admin/firestore';
import { randomUUID } from 'node:crypto';
import {
  firestoreAdminBatchChunkSchema,
  firestoreAdminBatchDtoSchema,
} from './firestore-admin-schemas';

/** Dependencies for the durable Firestore Admin batch store. */
export interface FirestoreAdminBatchStoreOptions {
  /** Trusted Admin SDK Firestore instance. */
  readonly firestore: Firestore;
  /** Root collection used for batch summaries. */
  readonly collectionPath: string;
  /** Technical clock supplied by the trusted host, normally backed by `TimeService`. */
  readonly clock?: ClockPort;
}

/** Submission and worker capabilities backed by the same Firestore store. */
export interface FirestoreAdminBatchStores<TPayload = unknown> {
  /** Unfenced capability used only by submission and materialization flows. */
  readonly submissionStore: BatchSubmissionStorePort<TPayload>;
  /** Fenced capability used to materialize selections into chunks. */
  readonly materializerStore: BatchMaterializerStorePort<TPayload>;
  /** Fenced capability used only by the trusted worker. */
  readonly workerStore: BatchWorkerStorePort<TPayload>;
}

interface BatchDto extends DocumentData {
  readonly batchId: string;
  readonly principalId: string;
  readonly schema: string;
  readonly operation: BatchOperationRecord['operation'];
  readonly status: BatchOperationRecord['status'];
  readonly total: number;
  readonly processed: number;
  readonly warnings: number;
  readonly failures: number;
  readonly retryCount: number;
  readonly currentChunk?: string;
  readonly createdAt: Timestamp;
  readonly updatedAt: Timestamp;
  readonly selection: BatchOperationRecord['selection'];
  readonly requestedSelection?: BatchOperationRecord['requestedSelection'];
  readonly payload?: unknown;
  readonly requestFingerprint: string;
  readonly cancellationRequested?: boolean;
  readonly idempotencyKey?: string;
  readonly leaseOwner?: string;
  readonly leaseToken?: string;
  readonly leaseUntil?: Timestamp;
  readonly materializationLeaseOwner?: string;
  readonly materializationLeaseToken?: string;
  readonly materializationLeaseUntil?: Timestamp;
}

type BatchPatch =
  BatchSubmissionPatch | BatchMaterializerPatch | BatchWorkerPatch;

type FirestoreAdminBatchImplementation<TPayload> = Pick<
  BatchSubmissionStorePort<TPayload>,
  | 'create'
  | 'get'
  | 'requestCancellation'
  | 'isCancellationRequested'
  | 'remove'
> & {
  claim(
    batchId: EntityId,
    request: BatchClaimRequest,
  ): Promise<BatchClaim<TPayload>>;
  update(
    batchId: EntityId,
    patch: BatchPatch,
    lease?: BatchLease,
    leaseKind?: LeaseKind,
  ): Promise<BatchOperationRecord<TPayload>>;
  listRunnableChunks(
    batchId: EntityId,
    limit?: number,
  ): Promise<readonly BatchChunk[]>;
  putChunk(
    batchId: EntityId,
    chunk: BatchChunk,
    lease: BatchLease,
    leaseKind?: LeaseKind,
  ): Promise<void>;
  putResults(
    batchId: EntityId,
    chunkId: EntityId,
    results: readonly BatchItemResult[],
    lease: BatchLease,
  ): Promise<void>;
  claimMaterialization(
    batchId: EntityId,
    request: BatchClaimRequest,
  ): Promise<BatchClaim<TPayload>>;
};

type LeaseKind = 'worker' | 'materialization';

const toTimestamp = (value: TechnicalTimestamp): Timestamp =>
  Timestamp.fromMillis(value.epochMilliseconds);

const toTechnicalTimestamp = (value: Timestamp): TechnicalTimestamp => ({
  kind: 'instant',
  epochMilliseconds: value.toMillis(),
});

const toDto = <TPayload>(record: BatchOperationRecord<TPayload>): BatchDto => ({
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
  leaseUntil: record.leaseUntil ? toTimestamp(record.leaseUntil) : undefined,
  materializationLeaseOwner: record.materializationLeaseOwner,
  materializationLeaseToken: record.materializationLeaseToken,
  materializationLeaseUntil: record.materializationLeaseUntil
    ? toTimestamp(record.materializationLeaseUntil)
    : undefined,
});

const fromDto = <TPayload>(value: unknown): BatchOperationRecord<TPayload> => {
  const dto = firestoreAdminBatchDtoSchema.parse(value) as BatchDto;
  return {
    batchId: dto.batchId as EntityId,
    principalId: dto.principalId as EntityId,
    schema: dto.schema,
    operation: dto.operation,
    status: dto.status,
    total: dto.total,
    processed: dto.processed,
    warnings: dto.warnings,
    failures: dto.failures,
    retryCount: dto.retryCount,
    currentChunk: dto.currentChunk as EntityId | undefined,
    createdAt: toTechnicalTimestamp(dto.createdAt),
    updatedAt: toTechnicalTimestamp(dto.updatedAt),
    selection: dto.selection,
    requestedSelection: dto.requestedSelection,
    payload: dto.payload as TPayload | undefined,
    requestFingerprint: dto.requestFingerprint,
    leaseOwner: dto.leaseOwner ?? undefined,
    leaseUntil: dto.leaseUntil
      ? toTechnicalTimestamp(dto.leaseUntil)
      : undefined,
    materializationLeaseOwner: dto.materializationLeaseOwner ?? undefined,
    materializationLeaseToken: dto.materializationLeaseToken ?? undefined,
    materializationLeaseUntil: dto.materializationLeaseUntil
      ? toTechnicalTimestamp(dto.materializationLeaseUntil)
      : undefined,
  };
};

const mapError = (error: unknown, message: string): never => {
  if (error instanceof DataAccessError) throw error;
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { readonly code: unknown }).code)
      : undefined;
  const mapped = mapFirestoreErrorCode(code);
  throw createDataAccessError(mapped, message, error);
};

function mapFirestoreErrorCode(code: string | undefined) {
  if (code === 'permission-denied') return 'forbidden' as const;
  if (code === 'not-found') return 'not-found' as const;
  if (code === 'already-exists') return 'conflict' as const;
  if (code === 'invalid-argument') return 'validation' as const;
  return 'transient' as const;
}

function updatedLeaseFields(current: BatchDto, patch: BatchPatch) {
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

const validateClaimRequest = (
  request: BatchClaimRequest,
  subject: 'worker' | 'materializer',
): void => {
  if (
    typeof request.ownerId !== 'string' ||
    !request.ownerId.trim() ||
    !Number.isInteger(request.leaseDurationMilliseconds) ||
    request.leaseDurationMilliseconds < 1
  ) {
    throw createDataAccessError(
      'validation',
      `${subject === 'worker' ? 'Batch worker' : 'Materializer'} identity and lease duration are invalid`,
    );
  }
};

/** Creates durable batch summaries, chunks, results and idempotency records. */
export function createFirestoreAdminBatchStore<TPayload = unknown>(
  options: FirestoreAdminBatchStoreOptions,
): FirestoreAdminBatchStores<TPayload> {
  const clock =
    options.clock ??
    ({
      now: () => ({
        kind: 'instant' as const,
        epochMilliseconds: Timestamp.now().toMillis(),
      }),
    } satisfies ClockPort);
  const timestampNow = () =>
    Timestamp.fromMillis(clock.now().epochMilliseconds);
  const root = options.firestore.collection(options.collectionPath);
  const idempotency = options.firestore.collection(
    `${options.collectionPath}__idempotency`,
  );
  const batchReference = (id: EntityId) => root.doc(id);
  const idempotencyReference = (principalId: EntityId, key: string) =>
    idempotency.doc(encodeURIComponent(`${principalId}\u0000${key}`));
  const chunkReference = (batchId: EntityId, chunkId: EntityId) =>
    batchReference(batchId).collection('chunks').doc(chunkId);
  const resultReference = (
    batchId: EntityId,
    chunkId: EntityId,
    itemId: EntityId,
  ) =>
    batchReference(batchId).collection('results').doc(`${chunkId}:${itemId}`);

  const requireLease = (
    current: BatchDto,
    lease: BatchLease,
    kind: LeaseKind,
  ): void => {
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
    const active =
      owner === lease.owner &&
      token === lease.token &&
      until !== undefined &&
      until.toMillis() > timestampNow().toMillis();
    if (!active) {
      throw createDataAccessError(
        'conflict',
        `The batch ${kind} lease is no longer valid`,
      );
    }
  };

  const encodeLeaseField = (
    encoded: Record<string, unknown>,
    patch: Record<string, unknown>,
    key: 'leaseUntil' | 'materializationLeaseUntil',
    tokenKey: 'leaseToken' | 'materializationLeaseToken',
  ): void => {
    if (!(key in patch) || patch[key] === undefined) return;
    const value = patch[key] as TechnicalTimestamp | null;
    encoded[key] = value ? toTimestamp(value) : null;
    if (value === null) encoded[tokenKey] = null;
  };

  const encodePatch = (
    patch: BatchSubmissionPatch | BatchMaterializerPatch | BatchWorkerPatch,
  ): Record<string, unknown> => {
    const encoded: Record<string, unknown> = {
      updatedAt: toTimestamp(patch.updatedAt),
    };
    Object.entries(patch).forEach(([key, value]) => {
      if (key !== 'updatedAt' && value !== undefined) encoded[key] = value;
    });
    const patchRecord = patch as unknown as Record<string, unknown>;
    encodeLeaseField(encoded, patchRecord, 'leaseUntil', 'leaseToken');
    encodeLeaseField(
      encoded,
      patchRecord,
      'materializationLeaseUntil',
      'materializationLeaseToken',
    );
    return encoded;
  };

  const idempotencyProjection = (dto: BatchDto): BatchDto => ({
    ...dto,
    requestedSelection: undefined,
    payload: undefined,
  });

  const removeDetails = async (
    collection: CollectionReference,
  ): Promise<void> => {
    while (true) {
      const page = await collection.limit(400).get();
      if (page.empty) return;
      const batch = options.firestore.batch();
      page.docs.forEach((item) => batch.delete(item.ref));
      await batch.commit();
      if (page.size < 400) return;
    }
  };

  const implementation: FirestoreAdminBatchImplementation<TPayload> = {
    async create(record, idempotencyKey) {
      try {
        const result = await options.firestore.runTransaction(
          async (transaction) => {
            const operationRef = batchReference(record.batchId);
            const keyRef = idempotencyReference(
              record.principalId,
              idempotencyKey,
            );
            const existingKey = await transaction.get(keyRef);
            if (existingKey.exists) {
              const stored = existingKey.data() as {
                readonly fingerprint: string;
                readonly batchId: string;
                readonly record?: BatchDto;
              };
              if (stored.fingerprint !== record.requestFingerprint) {
                throw createDataAccessError(
                  'conflict',
                  'The batch idempotency key was reused with a different request',
                );
              }
              const current = await transaction.get(
                batchReference(stored.batchId as EntityId),
              );
              if (!current.exists) {
                if (stored.record) return fromDto<TPayload>(stored.record);
                throw createDataAccessError(
                  'not-found',
                  'The idempotent batch no longer exists',
                );
              }
              return fromDto<TPayload>(current.data() as BatchDto);
            }
            const existingOperation = await transaction.get(operationRef);
            if (existingOperation.exists) {
              throw createDataAccessError(
                'conflict',
                'The batch id already exists',
              );
            }
            const dto = toDto(record);
            const durableDto = { ...dto, idempotencyKey };
            const retainedDto = {
              ...idempotencyProjection(durableDto),
              idempotencyKey,
            };
            transaction.create(operationRef, durableDto);
            transaction.create(keyRef, {
              fingerprint: record.requestFingerprint,
              batchId: record.batchId,
              record: retainedDto,
              createdAt: timestampNow(),
            });
            return record;
          },
        );
        return result;
      } catch (error) {
        return mapError(error, 'Firestore Admin batch creation failed');
      }
    },
    async get(batchId) {
      try {
        const snapshot = await batchReference(batchId).get();
        return snapshot.exists
          ? fromDto<TPayload>(snapshot.data() as BatchDto)
          : undefined;
      } catch (error) {
        return mapError(error, 'Firestore Admin batch read failed');
      }
    },
    async claimMaterialization(batchId, request) {
      try {
        validateClaimRequest(request, 'materializer');
        return await options.firestore.runTransaction(async (transaction) => {
          const reference = batchReference(batchId);
          const snapshot = await transaction.get(reference);
          if (!snapshot.exists)
            throw createDataAccessError('not-found', 'Batch was not found');
          const current = fromDto<TPayload>(snapshot.data() as BatchDto);
          const active =
            current.materializationLeaseUntil !== undefined &&
            current.materializationLeaseUntil.epochMilliseconds >
              request.now.epochMilliseconds;
          if (current.status !== 'materializing' || active) {
            return { claimed: false, record: current };
          }
          const leaseUntil = {
            kind: 'instant' as const,
            epochMilliseconds:
              request.now.epochMilliseconds + request.leaseDurationMilliseconds,
          };
          const leaseToken = randomUUID();
          transaction.update(reference, {
            materializationLeaseOwner: request.ownerId,
            materializationLeaseToken: leaseToken,
            materializationLeaseUntil: toTimestamp(leaseUntil),
          });
          return {
            claimed: true,
            record: {
              ...current,
              materializationLeaseOwner: request.ownerId,
              materializationLeaseToken: leaseToken,
              materializationLeaseUntil: leaseUntil,
            },
            lease: {
              owner: request.ownerId,
              token: leaseToken,
            },
          };
        });
      } catch (error) {
        return mapError(error, 'Firestore Admin materialization claim failed');
      }
    },
    async claim(
      batchId,
      request: BatchClaimRequest,
    ): Promise<BatchClaim<TPayload>> {
      try {
        validateClaimRequest(request, 'worker');
        return await options.firestore.runTransaction(async (transaction) => {
          const reference = batchReference(batchId);
          const snapshot = await transaction.get(reference);
          if (!snapshot.exists)
            throw createDataAccessError('not-found', 'Batch was not found');
          const current = fromDto<TPayload>(snapshot.data() as BatchDto);
          const leaseActive =
            current.leaseUntil !== undefined &&
            current.leaseUntil.epochMilliseconds >
              request.now.epochMilliseconds;
          if (
            current.status === 'materializing' ||
            current.status === 'cancelled' ||
            current.status === 'completed' ||
            current.status === 'completed-with-warnings' ||
            (current.status === 'running' && leaseActive)
          )
            return { claimed: false, record: current };
          const leaseUntil = {
            kind: 'instant' as const,
            epochMilliseconds:
              request.now.epochMilliseconds + request.leaseDurationMilliseconds,
          };
          const leaseToken = randomUUID();
          transaction.update(reference, {
            status: 'running',
            updatedAt: toTimestamp(request.now),
            leaseOwner: request.ownerId,
            leaseToken,
            leaseUntil: toTimestamp(leaseUntil),
          });
          return {
            claimed: true,
            record: {
              ...current,
              status: 'running',
              updatedAt: request.now,
              leaseOwner: request.ownerId,
              leaseUntil,
            },
            lease: { owner: request.ownerId, token: leaseToken },
          };
        });
      } catch (error) {
        return mapError(error, 'Firestore Admin batch claim failed');
      }
    },
    async update(
      batchId,
      patch: BatchSubmissionPatch | BatchMaterializerPatch | BatchWorkerPatch,
      lease,
      leaseKind: LeaseKind = 'worker',
    ) {
      try {
        const reference = batchReference(batchId);
        const encoded = encodePatch(patch);
        if (lease) {
          return await options.firestore.runTransaction(async (transaction) => {
            const snapshot = await transaction.get(reference);
            if (!snapshot.exists)
              throw createDataAccessError('not-found', 'Batch was not found');
            const current = snapshot.data() as BatchDto;
            requireLease(current, lease, leaseKind);
            transaction.update(reference, encoded as never);
            return fromDto<TPayload>({
              ...current,
              ...encoded,
              ...updatedLeaseFields(current, patch),
            });
          });
        }
        const snapshot = await reference.get();
        if (!snapshot.exists)
          throw createDataAccessError('not-found', 'Batch was not found');
        await reference.update(encoded);
        return fromDto<TPayload>({
          ...(snapshot.data() as BatchDto),
          ...encoded,
        });
      } catch (error) {
        return mapError(error, 'Firestore Admin batch update failed');
      }
    },
    async putChunk(batchId, chunk, lease, leaseKind: LeaseKind = 'worker') {
      try {
        await options.firestore.runTransaction(async (transaction) => {
          const batchSnapshot = await transaction.get(batchReference(batchId));
          if (!batchSnapshot.exists)
            throw createDataAccessError('not-found', 'Batch was not found');
          requireLease(batchSnapshot.data() as BatchDto, lease, leaseKind);
          transaction.set(chunkReference(batchId, chunk.chunkId), chunk);
        });
      } catch (error) {
        return mapError(error, 'Firestore Admin batch chunk write failed');
      }
    },
    async listRunnableChunks(batchId, limit) {
      try {
        const query = batchReference(batchId)
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
    },
    async putResults(batchId, chunkId, results, lease: BatchLease) {
      try {
        await options.firestore.runTransaction(async (transaction) => {
          const batchSnapshot = await transaction.get(batchReference(batchId));
          if (!batchSnapshot.exists)
            throw createDataAccessError('not-found', 'Batch was not found');
          requireLease(batchSnapshot.data() as BatchDto, lease, 'worker');
          for (const result of results) {
            transaction.set(resultReference(batchId, chunkId, result.id), {
              ...result,
              chunkId,
              completedAt: timestampNow(),
            });
          }
        });
      } catch (error) {
        return mapError(error, 'Firestore Admin batch result write failed');
      }
    },
    async requestCancellation(batchId) {
      try {
        const reference = batchReference(batchId);
        return await options.firestore.runTransaction(async (transaction) => {
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
          const updatedAt = timestampNow();
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
    },
    async isCancellationRequested(batchId) {
      try {
        const snapshot = await batchReference(batchId).get();
        if (!snapshot.exists)
          throw createDataAccessError('not-found', 'Batch was not found');
        return Boolean(snapshot.data()?.['cancellationRequested']);
      } catch (error) {
        return mapError(
          error,
          'Firestore Admin batch cancellation read failed',
        );
      }
    },
    async remove(batchId) {
      try {
        const reference = batchReference(batchId);
        const snapshot = await reference.get();
        if (!snapshot.exists)
          throw createDataAccessError('not-found', 'Batch was not found');
        const dto = snapshot.data() as BatchDto;
        await removeDetails(reference.collection('chunks'));
        await removeDetails(reference.collection('results'));
        const finalBatch = options.firestore.batch();
        if (dto.idempotencyKey) {
          finalBatch.update(
            idempotencyReference(
              dto.principalId as EntityId,
              dto.idempotencyKey,
            ),
            { record: idempotencyProjection(dto) },
          );
        }
        finalBatch.delete(reference);
        await finalBatch.commit();
      } catch (error) {
        return mapError(error, 'Firestore Admin batch removal failed');
      }
    },
  };
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
