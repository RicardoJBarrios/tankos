import { z } from 'zod';
import * as firestoreSdk from 'firebase/firestore';
import type {
  DocumentSnapshot,
  Firestore,
  Query,
  QueryDocumentSnapshot,
  Timestamp,
} from 'firebase/firestore';
import type {
  AccessContext,
  CrudRecord,
  CrudRepositoryPort,
  DataAccessErrorCode,
  ListRequest,
  PageCursor,
  TechnicalTimestamp,
} from '@tankos/data-access';
import type { ClockPort } from '@tankos/time';
import { createDataAccessError } from './firestore-errors';
import { FirestoreCrudRepositoryImplementation } from './firestore-crud-repository-implementation';

/** Firestore envelope stored for one provider-neutral CRUD record. */
export interface FirestoreRecordDto<TData> {
  readonly data: TData;
  readonly lifecycle: CrudRecord<TData>['lifecycle'];
  readonly revision: number;
  readonly metadata: {
    readonly schemaVersion: number;
    readonly createdAt: Timestamp;
    readonly updatedAt: Timestamp;
    readonly createdBy?: string;
    readonly updatedBy?: string;
    readonly lifecycleChangedAt?: Timestamp;
    readonly lifecycleChangedBy?: string;
  };
}

/** Firestore-specific dependencies that keep query policy in the host. */
export interface FirestoreCrudRepositoryOptions<
  TData,
  TCreate,
  TUpdate,
  TFilter,
> {
  readonly firestore: Firestore;
  readonly collectionPath: string;
  readonly recordSchema: z.ZodType<FirestoreRecordDto<TData>>;
  /** Schema version written to newly created records. Defaults to 1. */
  readonly schemaVersion?: number;
  /** Clock used for technical metadata; normally supplied by `TimeService`. */
  readonly clock?: ClockPort;
  readonly createId: (input: TCreate, access?: AccessContext) => string;
  /** Optional distinct id policy for immutable/versioned replacements. */
  readonly createReplacementId?: (
    input: TUpdate,
    access: AccessContext,
  ) => string;
  readonly createData: (input: TCreate, id: string) => TData;
  readonly updateData: (data: TData, input: TUpdate) => TData;
  readonly buildQuery: (
    reference: ReturnType<typeof firestoreSdk.collection>,
    request: ListRequest<TFilter>,
  ) => Query;
  readonly encodeCursor: (
    snapshot: QueryDocumentSnapshot,
    request: ListRequest<TFilter>,
  ) => PageCursor;
  readonly authorize?: (
    access: AccessContext,
    operation:
      'list' | 'get' | 'create' | 'replace' | 'mark' | 'restore' | 'delete',
    lifecycle?: readonly CrudRecord<TData>['lifecycle']['status'][],
  ) => void | Promise<void>;
}

/** Converts a Firestore timestamp to the technical instant contract. */
export function timestamp(value: Timestamp): TechnicalTimestamp {
  return { kind: 'instant', epochMilliseconds: value.toMillis() };
}

const firestoreErrorCodes: Readonly<Record<string, DataAccessErrorCode>> = {
  'permission-denied': 'forbidden',
  'not-found': 'not-found',
  'already-exists': 'conflict',
  aborted: 'transient',
  'invalid-argument': 'validation',
  'failed-precondition': 'permanent',
  'deadline-exceeded': 'transient',
  unavailable: 'transient',
  'resource-exhausted': 'transient',
};

/** Maps known Firestore provider errors to the data-access error taxonomy. */
export function firestoreErrorCode(
  error: unknown,
): DataAccessErrorCode | undefined {
  if (error instanceof z.ZodError) return 'validation';
  if (!isProviderError(error)) return undefined;
  const code = String(error.code);
  return firestoreErrorCodes[code];
}

function isProviderError(error: unknown): error is { readonly code: unknown } {
  return typeof error === 'object' && error !== null && 'code' in error;
}

/** Validates a single Firestore document identifier. */
export function validateDocumentId(id: string): string {
  if (typeof id !== 'string') throwInvalidDocumentId();
  if (!id.trim()) throwInvalidDocumentId();
  if (id === '.') throwInvalidDocumentId();
  if (id === '..') throwInvalidDocumentId();
  if (id.includes('/')) throwInvalidDocumentId();
  return id;
}

function throwInvalidDocumentId(): never {
  throw createDataAccessError(
    'validation',
    'Firestore document ids must be non-empty single path segments',
  );
}

/** Maps a validated Firestore DTO into the provider-neutral record. */
export function mapRecord<TData>(
  snapshot: DocumentSnapshot,
  schema: z.ZodType<FirestoreRecordDto<TData>>,
): CrudRecord<TData> {
  const dto = schema.parse(snapshot.data());
  return {
    id: snapshot.id as CrudRecord<TData>['id'],
    data: dto.data,
    lifecycle: dto.lifecycle,
    revision: dto.revision,
    metadata: {
      schemaVersion: dto.metadata.schemaVersion,
      createdAt: timestamp(dto.metadata.createdAt),
      updatedAt: timestamp(dto.metadata.updatedAt),
      createdBy: dto.metadata
        .createdBy as CrudRecord<TData>['metadata']['createdBy'],
      updatedBy: dto.metadata
        .updatedBy as CrudRecord<TData>['metadata']['updatedBy'],
      lifecycleChangedAt: dto.metadata.lifecycleChangedAt
        ? timestamp(dto.metadata.lifecycleChangedAt)
        : undefined,
      lifecycleChangedBy: dto.metadata
        .lifecycleChangedBy as CrudRecord<TData>['metadata']['lifecycleChangedBy'],
    },
  };
}

/** Creates a Firestore CRUD adapter with client-owned technical timestamps and revision checks. */
export function createFirestoreCrudRepository<
  TData,
  TCreate,
  TUpdate,
  TFilter = unknown,
>(
  options: FirestoreCrudRepositoryOptions<TData, TCreate, TUpdate, TFilter>,
): CrudRepositoryPort<TData, TCreate, TUpdate, TFilter> {
  return new FirestoreCrudRepositoryImplementation(options);
}
