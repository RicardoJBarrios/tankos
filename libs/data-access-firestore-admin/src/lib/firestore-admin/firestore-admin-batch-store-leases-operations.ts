import {
  createDataAccessError,
  type BatchClaimRequest,
  type BatchMaterializerPatch,
  type BatchMaterializerStorePort,
  type BatchSubmissionPatch,
  type BatchWorkerPatch,
  type BatchWorkerStorePort,
} from '@tankos/data-access';
import { randomUUID } from 'node:crypto';
import {
  fromDto,
  mapError,
  toTimestamp,
  type BatchDto,
  type FirestoreAdminBatchStoreContext,
  type LeaseKind,
  updatedLeaseFields,
  validateClaimRequest,
} from './firestore-admin-batch-store-context';

function createClaimMaterializationOperation<TPayload>(
  context: FirestoreAdminBatchStoreContext,
): BatchMaterializerStorePort<TPayload>['claimMaterialization'] {
  return async (batchId, request) => {
    try {
      validateClaimRequest(request, 'materializer');
      return await context.firestore.runTransaction(async (transaction) => {
        const reference = context.batchReference(batchId);
        const snapshot = await transaction.get(reference);
        if (!snapshot.exists)
          throw createDataAccessError('not-found', 'Batch was not found');
        const current = fromDto<TPayload>(snapshot.data());
        const active =
          current.materializationLeaseUntil !== undefined &&
          current.materializationLeaseUntil.epochMilliseconds >
            request.now.epochMilliseconds;
        if (active || current.status !== 'materializing') {
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
  };
}

function createClaimOperation<TPayload>(
  context: FirestoreAdminBatchStoreContext,
): BatchWorkerStorePort<TPayload>['claim'] {
  return async (batchId, request: BatchClaimRequest) => {
    try {
      validateClaimRequest(request, 'worker');
      return await context.firestore.runTransaction(async (transaction) => {
        const reference = context.batchReference(batchId);
        const snapshot = await transaction.get(reference);
        if (!snapshot.exists)
          throw createDataAccessError('not-found', 'Batch was not found');
        const current = fromDto<TPayload>(snapshot.data());
        const leaseActive =
          current.leaseUntil !== undefined &&
          current.leaseUntil.epochMilliseconds > request.now.epochMilliseconds;
        if (isClaimBlocked(current.status, leaseActive))
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
  };
}

function createUpdateOperation<TPayload>(
  context: FirestoreAdminBatchStoreContext,
): BatchWorkerStorePort<TPayload>['update'] {
  return async (
    batchId,
    patch: BatchSubmissionPatch | BatchMaterializerPatch | BatchWorkerPatch,
    lease,
    leaseKind: LeaseKind = 'worker',
  ) => {
    try {
      const reference = context.batchReference(batchId);
      const encoded = context.encodePatch(patch);
      if (lease) {
        return await updateWithLease(
          context,
          reference,
          encoded,
          patch,
          lease,
          leaseKind,
        );
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
  };
}

function isClaimBlocked(
  status: BatchDto['status'],
  leaseActive: boolean,
): boolean {
  return (
    status === 'materializing' ||
    status === 'cancelled' ||
    status === 'completed' ||
    status === 'completed-with-warnings' ||
    (status === 'running' && leaseActive)
  );
}

function updateWithLease<TPayload>(
  context: FirestoreAdminBatchStoreContext,
  reference: ReturnType<FirestoreAdminBatchStoreContext['batchReference']>,
  encoded: Record<string, unknown>,
  patch: BatchSubmissionPatch | BatchMaterializerPatch | BatchWorkerPatch,
  lease: Parameters<FirestoreAdminBatchStoreContext['requireLease']>[1],
  leaseKind: LeaseKind,
): Promise<Awaited<ReturnType<BatchWorkerStorePort<TPayload>['update']>>> {
  return context.firestore.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(reference);
    if (!snapshot.exists)
      throw createDataAccessError('not-found', 'Batch was not found');
    const current = snapshot.data() as BatchDto;
    context.requireLease(current, lease, leaseKind);
    transaction.update(reference, encoded as never);
    return fromDto<TPayload>({
      ...current,
      ...encoded,
      ...updatedLeaseFields(current, patch),
    });
  });
}

/** Creates the leases operations for the Admin batch store. */
export function createFirestoreAdminBatchStoreLeasesOperations<TPayload>(
  context: FirestoreAdminBatchStoreContext,
) {
  return {
    claimMaterialization:
      createClaimMaterializationOperation<TPayload>(context),
    claim: createClaimOperation<TPayload>(context),
    update: createUpdateOperation<TPayload>(context),
  };
}
