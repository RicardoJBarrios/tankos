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
  ServerTimestamp,
} from '@tank-os/data-access';
import { createAccessContext, createPageRequest } from '@tank-os/data-access';
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
  ) => void;
}

function timestamp(value: Timestamp): ServerTimestamp {
  return { kind: 'instant', epochMilliseconds: value.toMillis() };
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

/** Creates a Firestore CRUD adapter with server timestamps and revision checks. */
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
  if (!Number.isInteger(schemaVersion) || schemaVersion < 1) {
    throw new RangeError('Firestore schema version must be a positive integer');
  }
  const authorize = (
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
  ) => options.authorize?.(access, operation);
  const recordReference = (id: string) =>
    firestoreSdk.doc(options.firestore, options.collectionPath, id);
  const handle = (
    error: unknown,
    fallback: DataAccessErrorCode,
    message: string,
  ): never => {
    if (error instanceof Error && error.name === 'DataAccessError') throw error;
    throw createDataAccessError(fallback, message, error);
  };

  return {
    async list(request) {
      const access = createAccessContext(request.access);
      createPageRequest(request.page);
      authorize(access, 'list');
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
      authorize(access, 'get');
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
      /* c8 ignore next -- V8 reports the imported provider boundary as a synthetic branch. */
      const access = createAccessContext(request.access);
      authorize(access, 'create');
      const id = options.createId(request.input);
      const target = recordReference(id);
      try {
        await firestoreSdk.setDoc(target, {
          data: options.createData(request.input),
          lifecycle: { status: 'active' },
          revision: 1,
          metadata: {
            schemaVersion,
            createdAt: firestoreSdk.serverTimestamp(),
            updatedAt: firestoreSdk.serverTimestamp(),
            createdBy: access.principalId,
            updatedBy: access.principalId,
          },
        });
        return mapRecord(
          await firestoreSdk.getDoc(target),
          options.recordSchema,
        );
      } catch (error) {
        return handle(error, 'transient', 'Firestore create failed');
      }
    },
    async replace(request: RecordCommand, input: TUpdate) {
      const access = createAccessContext(request.access);
      authorize(access, 'replace');
      return transactUpdate(request, 'replace', (record) => ({
        data: options.updateData(record.data, input),
        lifecycle: record.lifecycle,
      }));
    },
    async markForDeletion(request) {
      const access = createAccessContext(request.access);
      authorize(access, 'mark');
      return transactUpdate(request, 'mark', () => ({
        lifecycle: { status: 'marked-for-deletion' as const },
      }));
    },
    async restore(request) {
      const access = createAccessContext(request.access);
      authorize(access, 'restore');
      return transactUpdate(request, 'restore', () => ({
        lifecycle: { status: 'active' as const },
      }));
    },
    async delete(request) {
      const access = createAccessContext(request.access);
      authorize(access, 'delete');
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
            if (
              request.expectedRevision !== undefined &&
              request.expectedRevision !== record.revision
            ) {
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

  async function transactUpdate(
    request: RecordCommand,
    operation: 'replace' | 'mark' | 'restore',
    change: (record: CrudRecord<TData>) => Partial<FirestoreRecordDto<TData>>,
  ): Promise<CrudRecord<TData>> {
    try {
      const snapshot = await firestoreSdk.runTransaction(
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
          if (
            request.expectedRevision !== undefined &&
            request.expectedRevision !== record.revision
          ) {
            throw createDataAccessError('conflict', 'Record revision is stale');
          }
          const updated = change(record);
          transaction.update(target, {
            ...updated,
            /* c8 ignore next -- V8 reports this provider-neutral arithmetic as a synthetic branch. */
            revision: record.revision + 1,
            'metadata.updatedAt': firestoreSdk.serverTimestamp(),
            'metadata.updatedBy': request.access.principalId,
            ...(operation === 'mark' || operation === 'restore'
              ? {
                  'metadata.lifecycleChangedAt': firestoreSdk.serverTimestamp(),
                  'metadata.lifecycleChangedBy': request.access.principalId,
                }
              : {}),
          });
          return target;
        },
      );
      return mapRecord(
        await firestoreSdk.getDoc(snapshot),
        options.recordSchema,
      );
    } catch (error) {
      return handle(error, 'transient', `Firestore ${operation} failed`);
    }
  }
}
