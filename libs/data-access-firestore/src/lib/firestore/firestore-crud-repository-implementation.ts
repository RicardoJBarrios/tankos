import * as firestoreSdk from 'firebase/firestore';
import type {
  CreateRequest,
  CrudRecord,
  CrudRepositoryPort,
  GetRequest,
  ListRequest,
  Page,
  RecordCommand,
} from '@tankos/data-access';
import {
  createAccessContext,
  createDataAccessError,
  createPageRequest,
} from '@tankos/data-access';
import type {
  FirestoreCrudRepositoryOptions,
  FirestoreRecordDto,
} from './firestore-crud-repository';
import {
  authorizeFirestoreAccess,
  authorizeFirestoreLifecycleRead,
  createFirestoreTimestampFactory,
  deleteFirestoreRecord,
  handleFirestoreError,
  transactFirestoreUpdate,
} from './firestore-crud-repository-policy';
import {
  firestoreErrorCode,
  mapRecord,
  timestamp,
  validateDocumentId,
} from './firestore-crud-repository';

/** Stateful Firestore CRUD implementation behind the public factory. */
export class FirestoreCrudRepositoryImplementation<
  TData,
  TCreate,
  TUpdate,
  TFilter,
> implements CrudRepositoryPort<TData, TCreate, TUpdate, TFilter> {
  readonly #options: FirestoreCrudRepositoryOptions<
    TData,
    TCreate,
    TUpdate,
    TFilter
  >;
  readonly #reference: ReturnType<typeof firestoreSdk.collection>;
  readonly #schemaVersion: number;
  readonly #timestampNow: () => firestoreSdk.Timestamp;

  constructor(
    options: FirestoreCrudRepositoryOptions<TData, TCreate, TUpdate, TFilter>,
  ) {
    this.#options = options;
    this.#reference = firestoreSdk.collection(
      options.firestore,
      options.collectionPath,
    );
    this.#schemaVersion = options.schemaVersion ?? 1;
    if (!Number.isInteger(this.#schemaVersion) || this.#schemaVersion < 1)
      throw new RangeError(
        'Firestore schema version must be a positive integer',
      );
    this.#timestampNow = createFirestoreTimestampFactory(options.clock);
  }

  async list(request: ListRequest<TFilter>): Promise<Page<CrudRecord<TData>>> {
    const access = createAccessContext(request.access);
    createPageRequest(request.page);
    await authorizeFirestoreLifecycleRead(
      this.#options,
      access,
      request.lifecycle,
      'list',
    );
    try {
      const result = await firestoreSdk.getDocs(
        firestoreSdk.query(
          this.#options.buildQuery(this.#reference, request),
          firestoreSdk.limit(request.page.pageSize + 1),
        ),
      );
      const documents = result.docs.slice(0, request.page.pageSize);
      return {
        items: documents.map((snapshot) =>
          mapRecord(snapshot, this.#options.recordSchema),
        ),
        hasMore: result.docs.length > request.page.pageSize,
        nextCursor:
          result.docs.length > request.page.pageSize
            ? this.#options.encodeCursor(
                documents[documents.length - 1],
                request,
              )
            : undefined,
      };
    } catch (error) {
      throw handleFirestoreError(
        error,
        firestoreErrorCode(error) ?? 'transient',
        'Firestore list failed',
      );
    }
  }

  async get(request: GetRequest) {
    const access = createAccessContext(request.access);
    await authorizeFirestoreLifecycleRead(
      this.#options,
      access,
      request.lifecycle,
      'get',
    );
    try {
      const result = await firestoreSdk.getDoc(
        this.#recordReference(request.id),
      );
      if (!result.exists()) return undefined;
      const record = mapRecord(result, this.#options.recordSchema);
      return new Set(request.lifecycle ?? ['active', 'inactive']).has(
        record.lifecycle.status,
      )
        ? record
        : undefined;
    } catch (error) {
      throw handleFirestoreError(
        error,
        firestoreErrorCode(error) ?? 'transient',
        'Firestore get failed',
      );
    }
  }

  async create(request: CreateRequest<TCreate>) {
    const access = createAccessContext(request.access);
    await authorizeFirestoreAccess(this.#options, access, 'create');
    const target = this.#recordReference(this.#options.createId(request.input));
    const createdAt = this.#timestampNow();
    const dto: FirestoreRecordDto<TData> = {
      data: this.#options.createData(request.input),
      lifecycle: { status: 'active' },
      revision: 1,
      metadata: {
        schemaVersion: this.#schemaVersion,
        createdAt,
        updatedAt: createdAt,
        createdBy: access.principalId,
        updatedBy: access.principalId,
      },
    };
    try {
      await firestoreSdk.runTransaction(
        this.#options.firestore,
        async (transaction) => {
          if ((await transaction.get(target)).exists())
            throw createDataAccessError(
              'conflict',
              'A record with the generated id already exists',
            );
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
      throw handleFirestoreError(
        error,
        firestoreErrorCode(error) ?? 'transient',
        'Firestore create failed',
      );
    }
  }

  async replace(request: RecordCommand, input: TUpdate) {
    await authorizeFirestoreAccess(
      this.#options,
      createAccessContext(request.access),
      'replace',
    );
    return transactFirestoreUpdate(
      this.#options,
      this.#timestampNow,
      request,
      'replace',
      (record) => ({
        data: this.#options.updateData(record.data, input),
        lifecycle: record.lifecycle,
      }),
    );
  }

  async markForDeletion(request: RecordCommand) {
    await authorizeFirestoreAccess(
      this.#options,
      createAccessContext(request.access),
      'mark',
    );
    return transactFirestoreUpdate(
      this.#options,
      this.#timestampNow,
      request,
      'mark',
      (record) => ({
        data: record.data,
        lifecycle: { status: 'marked-for-deletion' as const },
      }),
    );
  }

  async restore(request: RecordCommand) {
    await authorizeFirestoreAccess(
      this.#options,
      createAccessContext(request.access),
      'restore',
    );
    return transactFirestoreUpdate(
      this.#options,
      this.#timestampNow,
      request,
      'restore',
      (record) => ({
        data: record.data,
        lifecycle: { status: 'active' as const },
      }),
    );
  }

  async delete(request: RecordCommand): Promise<void> {
    await authorizeFirestoreAccess(
      this.#options,
      createAccessContext(request.access),
      'delete',
    );
    try {
      await firestoreSdk.runTransaction(
        this.#options.firestore,
        async (transaction) =>
          deleteFirestoreRecord(transaction, request, this.#options),
      );
    } catch (error) {
      throw handleFirestoreError(
        error,
        firestoreErrorCode(error) ?? 'transient',
        'Firestore delete failed',
      );
    }
  }

  #recordReference(id: string) {
    return firestoreSdk.doc(
      this.#options.firestore,
      this.#options.collectionPath,
      validateDocumentId(id),
    );
  }
}
