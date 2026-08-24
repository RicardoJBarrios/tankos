import { z } from 'zod';
import * as firestoreSdk from 'firebase/firestore';
import type {
  DocumentData,
  DocumentSnapshot,
  Firestore,
  Query,
  QueryDocumentSnapshot,
  Timestamp,
} from 'firebase/firestore';
import type {
  AccessContext,
  CreateRequest,
  CrudRecord,
  CrudRepositoryPort,
  DataAccessErrorCode,
  GetRequest,
  ListRequest,
  Page,
  PageCursor,
  RecordCommand,
  TechnicalTimestamp,
} from '@tank-os/data-access';
import type { ClockPort } from '@tank-os/time';
import {
  createAccessContext,
  createPageRequest,
  validateLifecycleSelection,
} from '@tank-os/data-access';
import { createDataAccessError } from './firestore-errors';

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
  readonly createId: (input: TCreate) => string;
  readonly createData: (input: TCreate) => TData;
  readonly updateData: (data: TData, input: TUpdate) => TData;
  readonly buildQuery: (
    reference: ReturnType<typeof firestoreSdk.collection>,
    request: ListRequest<TFilter>,
  ) => Query<DocumentData>;
  readonly encodeCursor: (
    snapshot: QueryDocumentSnapshot<DocumentData>,
    request: ListRequest<TFilter>,
  ) => PageCursor;
  readonly authorize?: (
    access: AccessContext,
    operation:
      'list' | 'get' | 'create' | 'replace' | 'mark' | 'restore' | 'delete',
    lifecycle?: readonly CrudRecord<TData>['lifecycle']['status'][] | undefined,
  ) => void | Promise<void>;
}

function timestamp(value: Timestamp): TechnicalTimestamp {
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

function firestoreErrorCode(error: unknown): DataAccessErrorCode | undefined {
  if (error instanceof z.ZodError) return 'validation';
  const code =
    typeof error === 'object' && error !== null && 'code' in error
      ? String((error as { readonly code: unknown }).code)
      : undefined;
  if (code === undefined) return undefined;
  return firestoreErrorCodes[code];
}

function validateDocumentId(id: string): string {
  if (
    typeof id !== 'string' ||
    !id.trim() ||
    id === '.' ||
    id === '..' ||
    id.includes('/')
  ) {
    throw createDataAccessError(
      'validation',
      'Firestore document ids must be non-empty single path segments',
    );
  }
  return id;
}

function mapRecord<TData>(
  snapshot: DocumentSnapshot<DocumentData>,
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
  const reference = firestoreSdk.collection(
    options.firestore,
    options.collectionPath,
  );
  const schemaVersion = options.schemaVersion ?? 1;
  const configuredClock = options.clock;
  const timestampNow = configuredClock
    ? () =>
        firestoreSdk.Timestamp.fromMillis(
          configuredClock.now().epochMilliseconds,
        )
    : () => firestoreSdk.Timestamp.now();
  if (!Number.isInteger(schemaVersion) || schemaVersion < 1) {
    throw new RangeError('Firestore schema version must be a positive integer');
  }
  const authorize = async (
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
    lifecycle?: ListRequest<TFilter>['lifecycle'] | GetRequest['lifecycle'],
  ) => {
    if (options.authorize) {
      await options.authorize(access, operation, lifecycle);
      return;
    }
    if (
      operation === 'mark' ||
      operation === 'restore' ||
      operation === 'delete'
    ) {
      throw createDataAccessError(
        'forbidden',
        `Firestore ${operation} requires an authorization policy`,
      );
    }
  };
  const authorizeLifecycleRead = async (
    access: AccessContext,
    lifecycle: ListRequest<TFilter>['lifecycle'] | GetRequest['lifecycle'],
    operation: 'list' | 'get',
  ) => {
    validateLifecycleSelection(lifecycle);
    if (
      lifecycle?.some(
        (status) => status !== 'active' && status !== 'inactive',
      ) &&
      !options.authorize
    ) {
      throw createDataAccessError(
        'forbidden',
        `Firestore ${operation} requires an authorization policy for hidden lifecycle states`,
      );
    }
    await authorize(access, operation, lifecycle);
  };
  const recordReference = (id: string) =>
    firestoreSdk.doc(
      options.firestore,
      options.collectionPath,
      validateDocumentId(id),
    );
  const handle = (
    error: unknown,
    fallback: DataAccessErrorCode,
    message: string,
  ): never => {
    if (error instanceof Error && error.name === 'DataAccessError') throw error;
    throw createDataAccessError(
      firestoreErrorCode(error) ?? fallback,
      message,
      error,
    );
  };

  const transactUpdate = async (
    request: RecordCommand,
    operation: 'replace' | 'mark' | 'restore',
    change: (record: CrudRecord<TData>) => {
      readonly data: TData;
      readonly lifecycle: CrudRecord<TData>['lifecycle'];
    },
  ): Promise<CrudRecord<TData>> => {
    try {
      const updated = await firestoreSdk.runTransaction(
        options.firestore,
        async (transaction) => {
          const target = recordReference(request.id);
          const current = await transaction.get(target);
          if (!current.exists())
            throw createDataAccessError('not-found', 'Record was not found');
          const record = mapRecord(current, options.recordSchema);
          if (record.lifecycle.status === 'deleted') {
            throw createDataAccessError(
              'lifecycle',
              'Record is terminally deleted',
            );
          }
          if (!Number.isInteger(request.expectedRevision)) {
            throw createDataAccessError(
              'validation',
              'Record commands require an integer expectedRevision',
            );
          }
          if (request.expectedRevision !== record.revision) {
            throw createDataAccessError('conflict', 'Record revision is stale');
          }
          const updated = change(record);
          const updatedAt = timestampNow();
          transaction.update(target, {
            ...updated,
            revision: record.revision + 1,
            'metadata.updatedAt': updatedAt,
            'metadata.updatedBy': request.access.principalId,
            ...(operation === 'mark' || operation === 'restore'
              ? {
                  'metadata.lifecycleChangedAt': updatedAt,
                  'metadata.lifecycleChangedBy': request.access.principalId,
                }
              : {}),
          });
          const metadata = Object.assign({}, record.metadata, {
            updatedAt: timestamp(updatedAt),
            updatedBy: request.access.principalId,
            ...(operation === 'mark' || operation === 'restore'
              ? {
                  lifecycleChangedAt: timestamp(updatedAt),
                  lifecycleChangedBy: request.access.principalId,
                }
              : {}),
          });
          return {
            ...record,
            data: updated.data,
            lifecycle: updated.lifecycle,
            revision: record.revision + 1,
            metadata,
          } satisfies CrudRecord<TData>;
        },
      );
      return updated;
    } catch (error) {
      return handle(error, 'transient', `Firestore ${operation} failed`);
    }
  };

  return {
    async list(request) {
      const access = createAccessContext(request.access);
      createPageRequest(request.page);
      await authorizeLifecycleRead(access, request.lifecycle, 'list');
      try {
        const result = await firestoreSdk.getDocs(
          firestoreSdk.query(
            options.buildQuery(reference, request),
            firestoreSdk.limit(request.page.pageSize + 1),
          ),
        );
        const documents = result.docs.slice(0, request.page.pageSize);
        const hasMore = result.docs.length > request.page.pageSize;
        return {
          items: documents.map((snapshot) =>
            mapRecord(snapshot, options.recordSchema),
          ),
          hasMore,
          nextCursor: hasMore
            ? options.encodeCursor(documents[documents.length - 1], request)
            : undefined,
        } satisfies Page<CrudRecord<TData>>;
      } catch (error) {
        return handle(error, 'transient', 'Firestore list failed');
      }
    },
    async get(request: GetRequest) {
      const access = createAccessContext(request.access);
      await authorizeLifecycleRead(access, request.lifecycle, 'get');
      try {
        const result = await firestoreSdk.getDoc(recordReference(request.id));
        if (!result.exists()) return undefined;
        const record = mapRecord(result, options.recordSchema);
        const lifecycle = new Set(request.lifecycle ?? ['active', 'inactive']);
        return lifecycle.has(record.lifecycle.status) ? record : undefined;
      } catch (error) {
        return handle(error, 'transient', 'Firestore get failed');
      }
    },
    async create(request: CreateRequest<TCreate>) {
      const access = createAccessContext(request.access);
      await authorize(access, 'create');
      const id = options.createId(request.input);
      const target = recordReference(id);
      const createdAt = timestampNow();
      const dto: FirestoreRecordDto<TData> = {
        data: options.createData(request.input),
        lifecycle: { status: 'active' },
        revision: 1,
        metadata: {
          schemaVersion,
          createdAt,
          updatedAt: createdAt,
          createdBy: access.principalId,
          updatedBy: access.principalId,
        },
      };
      try {
        await firestoreSdk.runTransaction(
          options.firestore,
          async (transaction) => {
            const current = await transaction.get(target);
            if (current.exists()) {
              throw createDataAccessError(
                'conflict',
                'A record with the generated id already exists',
              );
            }
            transaction.set(target, dto);
          },
        );
        return {
          id: target.id as CrudRecord<TData>['id'],
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
          },
        } satisfies CrudRecord<TData>;
      } catch (error) {
        return handle(error, 'transient', 'Firestore create failed');
      }
    },
    async replace(request: RecordCommand, input: TUpdate) {
      const access = createAccessContext(request.access);
      await authorize(access, 'replace');
      return transactUpdate(request, 'replace', (record) => ({
        data: options.updateData(record.data, input),
        lifecycle: record.lifecycle,
      }));
    },
    async markForDeletion(request) {
      const access = createAccessContext(request.access);
      await authorize(access, 'mark');
      return transactUpdate(request, 'mark', (record) => ({
        data: record.data,
        lifecycle: { status: 'marked-for-deletion' as const },
      }));
    },
    async restore(request) {
      const access = createAccessContext(request.access);
      await authorize(access, 'restore');
      return transactUpdate(request, 'restore', (record) => ({
        data: record.data,
        lifecycle: { status: 'active' as const },
      }));
    },
    async delete(request) {
      const access = createAccessContext(request.access);
      await authorize(access, 'delete');
      try {
        await firestoreSdk.runTransaction(
          options.firestore,
          async (transaction) => {
            const snapshot = await transaction.get(recordReference(request.id));
            if (!snapshot.exists())
              throw createDataAccessError('not-found', 'Record was not found');
            const record = mapRecord(snapshot, options.recordSchema);
            if (record.lifecycle.status !== 'marked-for-deletion') {
              throw createDataAccessError(
                'lifecycle',
                'Record must be marked for deletion',
              );
            }
            if (!Number.isInteger(request.expectedRevision)) {
              throw createDataAccessError(
                'validation',
                'Record commands require an integer expectedRevision',
              );
            }
            if (request.expectedRevision !== record.revision) {
              throw createDataAccessError(
                'conflict',
                'Record revision is stale',
              );
            }
            transaction.delete(recordReference(request.id));
          },
        );
      } catch (error) {
        return handle(error, 'transient', 'Firestore delete failed');
      }
    },
  };
}
