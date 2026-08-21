import {
  DataAccessError,
  createDataAccessError,
  type BatchClaim,
  type BatchClaimRequest,
  type BatchChunk,
  type BatchOperationRecord,
  type BatchSummaryPatch,
  type BatchStorePort,
  type EntityId,
  type TechnicalTimestamp,
} from '@tank-os/data-access';
import {
  Timestamp,
  type DocumentData,
  type Firestore,
} from 'firebase-admin/firestore';

/** Dependencies for the durable Firestore Admin batch store. */
export interface FirestoreAdminBatchStoreOptions {
  /** Trusted Admin SDK Firestore instance. */
  readonly firestore: Firestore;
  /** Root collection used for batch summaries. */
  readonly collectionPath: string;
  /** Technical clock used for provider metadata. */
  readonly now?: () => Timestamp;
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
  readonly leaseUntil?: Timestamp;
}

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
});

const fromDto = <TPayload>(dto: BatchDto): BatchOperationRecord<TPayload> => ({
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
});

const mapError = (error: unknown, message: string): never => {
  if (error instanceof DataAccessError) throw error;
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { readonly code: unknown }).code)
      : undefined;
  const mapped =
    code === 'permission-denied'
      ? 'forbidden'
      : code === 'not-found'
        ? 'not-found'
        : code === 'already-exists'
          ? 'conflict'
          : code === 'invalid-argument'
            ? 'validation'
            : 'transient';
  throw createDataAccessError(mapped, message, error);
};

/** Creates durable batch summaries, chunks, results and idempotency records. */
export function createFirestoreAdminBatchStore<TPayload = unknown>(
  options: FirestoreAdminBatchStoreOptions,
): BatchStorePort<TPayload> {
  const now = options.now ?? (() => Timestamp.now());
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

  return {
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
              const current = await transaction.get(batchReference(stored.batchId as EntityId));
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
            transaction.create(operationRef, durableDto);
            transaction.create(keyRef, {
              fingerprint: record.requestFingerprint,
              batchId: record.batchId,
              record: durableDto,
              createdAt: now(),
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
    async claim(batchId, request: BatchClaimRequest): Promise<BatchClaim<TPayload>> {
      try {
        if (
          typeof request.workerId !== 'string' ||
          !request.workerId.trim() ||
          !Number.isInteger(request.leaseDurationMilliseconds) ||
          request.leaseDurationMilliseconds < 1
        ) {
          throw createDataAccessError(
            'validation',
            'Batch worker identity and lease duration are invalid',
          );
        }
        return await options.firestore.runTransaction(async (transaction) => {
          const reference = batchReference(batchId);
          const snapshot = await transaction.get(reference);
          if (!snapshot.exists)
            throw createDataAccessError('not-found', 'Batch was not found');
          const current = fromDto<TPayload>(snapshot.data() as BatchDto);
          const leaseActive =
            current.leaseUntil !== undefined &&
            current.leaseUntil.epochMilliseconds > request.now.epochMilliseconds;
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
          transaction.update(reference, {
            status: 'running',
            updatedAt: toTimestamp(request.now),
            leaseOwner: request.workerId,
            leaseUntil: toTimestamp(leaseUntil),
          });
          return {
            claimed: true,
            record: {
              ...current,
              status: 'running',
              updatedAt: request.now,
              leaseOwner: request.workerId,
              leaseUntil,
            },
          };
        });
      } catch (error) {
        return mapError(error, 'Firestore Admin batch claim failed');
      }
    },
    async update(batchId, patch: BatchSummaryPatch) {
      try {
        const reference = batchReference(batchId);
        const snapshot = await reference.get();
        if (!snapshot.exists)
          throw createDataAccessError('not-found', 'Batch was not found');
        const encoded: Record<string, unknown> = {
          ...patch,
          updatedAt: toTimestamp(patch.updatedAt),
        };
        if (patch.leaseUntil !== undefined) {
          encoded['leaseUntil'] = patch.leaseUntil
            ? toTimestamp(patch.leaseUntil)
            : null;
        }
        await reference.update({
          ...encoded,
          updatedAt: toTimestamp(patch.updatedAt),
        });
        return fromDto<TPayload>({
          ...(snapshot.data() as BatchDto),
          ...encoded,
          updatedAt: toTimestamp(patch.updatedAt),
          leaseUntil:
            patch.leaseUntil === null
              ? undefined
              : patch.leaseUntil
                ? toTimestamp(patch.leaseUntil)
                : (snapshot.data() as BatchDto).leaseUntil,
        });
      } catch (error) {
        return mapError(error, 'Firestore Admin batch update failed');
      }
    },
    async putChunk(batchId, chunk) {
      try {
        await chunkReference(batchId, chunk.chunkId).set(chunk);
      } catch (error) {
        return mapError(error, 'Firestore Admin batch chunk write failed');
      }
    },
    async listRunnableChunks(batchId, limit) {
      try {
        const query = batchReference(batchId)
          .collection('chunks')
          .where('status', 'in', ['pending', 'failed']);
        const result = await (limit === undefined ? query : query.limit(limit)).get();
        return result.docs.map((item) => item.data() as BatchChunk);
      } catch (error) {
        return mapError(error, 'Firestore Admin batch chunk read failed');
      }
    },
    async putResult(batchId, chunkId, result) {
      try {
        await resultReference(batchId, chunkId, result.id).set({
          ...result,
          chunkId,
          completedAt: now(),
        });
      } catch (error) {
        return mapError(error, 'Firestore Admin batch result write failed');
      }
    },
    async requestCancellation(batchId) {
      try {
        const reference = batchReference(batchId);
        const snapshot = await reference.get();
        if (!snapshot.exists)
          throw createDataAccessError('not-found', 'Batch was not found');
        const updatedAt = now();
        await reference.update({ cancellationRequested: true, updatedAt });
        return fromDto<TPayload>({
          ...(snapshot.data() as BatchDto),
          cancellationRequested: true,
          updatedAt,
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
        const [snapshot, chunks, results] = await Promise.all([
          reference.get(),
          reference.collection('chunks').get(),
          reference.collection('results').get(),
        ]);
        if (!snapshot.exists)
          throw createDataAccessError('not-found', 'Batch was not found');
        const dto = snapshot.data() as BatchDto;
        const references = [
          ...chunks.docs.map((item) => item.ref),
          ...results.docs.map((item) => item.ref),
        ];
        for (let offset = 0; offset < references.length; offset += 400) {
          const batch = options.firestore.batch();
          references
            .slice(offset, offset + 400)
            .forEach((item) => batch.delete(item));
          await batch.commit();
        }
        const finalBatch = options.firestore.batch();
        if (dto.idempotencyKey) {
          finalBatch.update(
            idempotencyReference(dto.principalId as EntityId, dto.idempotencyKey),
            { record: dto },
          );
        }
        finalBatch.delete(reference);
        await finalBatch.commit();
      } catch (error) {
        return mapError(error, 'Firestore Admin batch removal failed');
      }
    },
  };
}
