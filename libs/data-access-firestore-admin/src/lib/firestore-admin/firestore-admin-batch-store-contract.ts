import type { ClockPort } from '@tankos/time';
import type {
  BatchClaim,
  BatchClaimRequest,
  BatchChunk,
  BatchItemResult,
  BatchLease,
  BatchMaterializerPatch,
  BatchMaterializerStorePort,
  BatchOperationRecord,
  BatchSubmissionPatch,
  BatchSubmissionStorePort,
  BatchWorkerPatch,
  BatchWorkerStorePort,
  EntityId,
} from '@tankos/data-access';
import type {
  CollectionReference,
  DocumentData,
  DocumentReference,
  Firestore,
} from 'firebase-admin/firestore';
import { Timestamp } from 'firebase-admin/firestore';

/** Dependencies for the durable Firestore Admin batch store. */
export interface FirestoreAdminBatchStoreOptions {
  /** Trusted Admin SDK Firestore instance. */
  readonly firestore: Firestore;
  /** Root collection used for batch summaries. */
  readonly collectionPath: string;
  /** Technical clock supplied by the trusted host. */
  readonly clock?: ClockPort;
}

/** Public capabilities backed by one durable Firestore Admin store. */
export interface FirestoreAdminBatchStores<TPayload = unknown> {
  /** Capability for submission and administrative lifecycle operations. */
  readonly submissionStore: BatchSubmissionStorePort<TPayload>;
  /** Capability for selection materialization. */
  readonly materializerStore: BatchMaterializerStorePort<TPayload>;
  /** Capability for trusted worker execution. */
  readonly workerStore: BatchWorkerStorePort<TPayload>;
}

/** Firestore document representation of a batch operation. */
export interface BatchDto extends DocumentData {
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

/** Patch accepted by a batch capability. */
export type BatchPatch =
  BatchSubmissionPatch | BatchMaterializerPatch | BatchWorkerPatch;

/** Lease namespace used by workers and materializers. */
export type LeaseKind = 'worker' | 'materialization';

/** Shared persistence dependencies used by operation modules. */
export interface FirestoreAdminBatchStoreContext {
  readonly firestore: Firestore;
  readonly timestampNow: () => Timestamp;
  readonly batchReference: (id: EntityId) => DocumentReference;
  readonly idempotencyReference: (
    principalId: EntityId,
    key: string,
  ) => DocumentReference;
  readonly chunkReference: (
    batchId: EntityId,
    chunkId: EntityId,
  ) => DocumentReference;
  readonly resultReference: (
    batchId: EntityId,
    chunkId: EntityId,
    itemId: EntityId,
  ) => DocumentReference;
  readonly requireLease: (
    current: BatchDto,
    lease: BatchLease,
    kind: LeaseKind,
  ) => void;
  readonly encodePatch: (patch: BatchPatch) => Record<string, unknown>;
  readonly idempotencyProjection: (dto: BatchDto) => BatchDto;
  readonly removeDetails: (collection: CollectionReference) => Promise<void>;
}

/** Complete internal implementation before public capability fencing. */
export interface FirestoreAdminBatchImplementation<TPayload> {
  readonly create: BatchSubmissionStorePort<TPayload>['create'];
  readonly get: BatchSubmissionStorePort<TPayload>['get'];
  readonly requestCancellation: BatchSubmissionStorePort<TPayload>['requestCancellation'];
  readonly isCancellationRequested: BatchSubmissionStorePort<TPayload>['isCancellationRequested'];
  readonly remove: BatchSubmissionStorePort<TPayload>['remove'];
  readonly claim: (
    batchId: EntityId,
    request: BatchClaimRequest,
  ) => Promise<BatchClaim<TPayload>>;
  readonly claimMaterialization: (
    batchId: EntityId,
    request: BatchClaimRequest,
  ) => Promise<BatchClaim<TPayload>>;
  readonly update: (
    batchId: EntityId,
    patch: BatchPatch,
    lease?: BatchLease,
    leaseKind?: LeaseKind,
  ) => Promise<BatchOperationRecord<TPayload>>;
  readonly putChunk: (
    batchId: EntityId,
    chunk: BatchChunk,
    lease: BatchLease,
    leaseKind?: LeaseKind,
  ) => Promise<void>;
  readonly listRunnableChunks: (
    batchId: EntityId,
    limit?: number,
  ) => Promise<readonly BatchChunk[]>;
  readonly putResults: (
    batchId: EntityId,
    chunkId: EntityId,
    results: readonly BatchItemResult[],
    lease: BatchLease,
  ) => Promise<void>;
}
