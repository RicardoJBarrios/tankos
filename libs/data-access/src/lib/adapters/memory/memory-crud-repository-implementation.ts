import { DataAccessError } from '../../core/errors';
import type {
  CrudRecord,
  CreateRequest,
  CrudRepositoryPort,
  DataAccessErrorCode,
  GetRequest,
  ListRequest,
  Page,
  RecordCommand,
} from '../../core';
import {
  createPageCursor,
  createAccessContext,
  createPageRequest,
} from '../../core';
import type { InMemoryCrudRepositoryOptions } from './memory-crud-repository';

/** Stateful in-memory implementation used by the public factory. */
export class MemoryCrudRepository<
  TData,
  TCreate,
  TUpdate,
  TFilter,
> implements CrudRepositoryPort<TData, TCreate, TUpdate, TFilter> {
  readonly #records: Map<string, CrudRecord<TData>>;
  readonly #options: InMemoryCrudRepositoryOptions<
    TData,
    TCreate,
    TUpdate,
    TFilter
  >;
  readonly #visibleByDefault = new Set(['active', 'inactive']);
  readonly #elevatedRoles: Set<string>;

  constructor(
    options: InMemoryCrudRepositoryOptions<TData, TCreate, TUpdate, TFilter>,
  ) {
    this.#options = options;
    this.#records = new Map(
      (this.#options.initialRecords ?? []).map((record) => [record.id, record]),
    );
    this.#elevatedRoles = new Set(
      this.#options.elevatedRoles ?? ['moderator', 'administrator', 'worker'],
    );
  }

  async list(request: ListRequest<TFilter>): Promise<Page<CrudRecord<TData>>> {
    this.#validateAccess(request.access);
    createPageRequest(request.page);
    this.#validateLifecycleSelection(request.access, request.lifecycle);
    const lifecycle = new Set(request.lifecycle ?? [...this.#visibleByDefault]);
    const filtered = this.#filterRecords(request, lifecycle);
    this.#sortRecords(filtered, request.page.orderBy);
    const start = this.#cursorStart(
      filtered,
      request.page.after,
      request.page.orderBy,
    );
    const items = filtered.slice(start, start + request.page.pageSize);
    const hasMore = start + items.length < filtered.length;
    return {
      items,
      hasMore,
      nextCursor: hasMore
        ? this.#nextCursor(items, request.page.orderBy)
        : undefined,
    };
  }

  async get(request: GetRequest): Promise<CrudRecord<TData> | undefined> {
    this.#validateAccess(request.access);
    this.#validateLifecycleSelection(request.access, request.lifecycle);
    const record = this.#records.get(request.id);
    if (!record) return undefined;
    const lifecycle = new Set(request.lifecycle ?? [...this.#visibleByDefault]);
    return lifecycle.has(record.lifecycle.status) ? record : undefined;
  }

  async create(request: CreateRequest<TCreate>): Promise<CrudRecord<TData>> {
    this.#validateAccess(request.access);
    const record = this.#options.create(
      request.input,
      this.#options.clock.now(),
    );
    if (this.#records.has(record.id))
      throw this.#failure('conflict', `Record ${record.id} already exists`);
    this.#records.set(record.id, record);
    return record;
  }

  async replace(
    request: RecordCommand,
    input: TUpdate,
  ): Promise<CrudRecord<TData>> {
    const record = this.#requireRecord(request);
    this.#requireRevision(record, request);
    this.#requireNotDeleted(record);
    const replacement = this.#withUpdatedMetadata(record, request.access);
    const updated = {
      ...replacement,
      data: this.#options.update(record.data, input),
    };
    this.#records.set(record.id, updated);
    return updated;
  }

  async markForDeletion(request: RecordCommand): Promise<CrudRecord<TData>> {
    this.#requireLifecycleRole(request.access);
    const record = this.#requireRecord(request);
    this.#requireRevision(record, request);
    this.#requireNotDeleted(record);
    const updated = this.#withUpdatedMetadata(record, request.access, {
      status: 'marked-for-deletion',
    });
    this.#records.set(record.id, updated);
    return updated;
  }

  async restore(request: RecordCommand): Promise<CrudRecord<TData>> {
    this.#requireLifecycleRole(request.access);
    const record = this.#requireRecord(request);
    this.#requireRevision(record, request);
    if (record.lifecycle.status !== 'marked-for-deletion')
      throw this.#failure(
        'lifecycle',
        `Record ${record.id} is not marked for deletion`,
      );
    const updated = this.#withUpdatedMetadata(record, request.access, {
      status: 'active',
    });
    this.#records.set(record.id, updated);
    return updated;
  }

  async delete(request: RecordCommand): Promise<void> {
    this.#requireLifecycleRole(request.access);
    const record = this.#requireRecord(request);
    this.#requireRevision(record, request);
    if (record.lifecycle.status !== 'marked-for-deletion')
      throw this.#failure(
        'lifecycle',
        `Record ${record.id} must be marked for deletion`,
      );
    this.#records.delete(record.id);
  }

  #failure(code: DataAccessErrorCode, message: string): DataAccessError {
    return new DataAccessError(code, message, {
      retryable: code === 'transient',
    });
  }

  #validateAccess(access: Parameters<typeof createAccessContext>[0]): void {
    createAccessContext(access);
  }

  #requireLifecycleRole(
    access: Parameters<typeof createAccessContext>[0],
  ): void {
    this.#validateAccess(access);
    if (!access.roles.some((role) => this.#elevatedRoles.has(role)))
      throw this.#failure(
        'forbidden',
        'Lifecycle operations require an elevated role',
      );
  }

  #requireRecord(request: RecordCommand): CrudRecord<TData> {
    this.#validateAccess(request.access);
    const record = this.#records.get(request.id);
    if (!record)
      throw this.#failure('not-found', `Record ${request.id} was not found`);
    return record;
  }

  #validateLifecycleSelection(
    access: Parameters<typeof createAccessContext>[0],
    lifecycle: readonly string[] | undefined,
  ): void {
    if (lifecycle?.some((status) => !this.#visibleByDefault.has(status)))
      this.#requireLifecycleRole(access);
  }

  #requireRevision(record: CrudRecord<TData>, request: RecordCommand): void {
    if (!Number.isInteger(request.expectedRevision))
      throw this.#failure(
        'validation',
        'Record commands require an integer expectedRevision',
      );
    if (request.expectedRevision !== record.revision)
      throw this.#failure('conflict', `Record ${record.id} revision is stale`);
  }

  #requireNotDeleted(record: CrudRecord<TData>): void {
    if (record.lifecycle.status === 'deleted')
      throw this.#failure(
        'lifecycle',
        `Record ${record.id} is terminally deleted`,
      );
  }

  #withUpdatedMetadata(
    record: CrudRecord<TData>,
    access: RecordCommand['access'],
    lifecycle = record.lifecycle,
  ) {
    const changed = lifecycle.status !== record.lifecycle.status;
    const now = this.#options.clock.now();
    return {
      ...record,
      lifecycle,
      revision: record.revision + 1,
      metadata: {
        ...record.metadata,
        updatedAt: now,
        updatedBy: access.principalId,
        ...(changed
          ? { lifecycleChangedAt: now, lifecycleChangedBy: access.principalId }
          : {}),
      },
    };
  }

  #filterRecords(
    request: ListRequest<TFilter>,
    lifecycle: Set<string>,
  ): CrudRecord<TData>[] {
    const matcher = this.#options.matches;
    if (request.filter !== undefined && matcher === undefined)
      throw this.#failure('validation', 'A filter requires a matcher');
    return [...this.#records.values()].filter(
      (record) =>
        lifecycle.has(record.lifecycle.status) &&
        (request.filter === undefined ||
          matcher?.(record, request.filter) === true),
    );
  }

  #sortRecords(
    records: CrudRecord<TData>[],
    orderBy: ListRequest<TFilter>['page']['orderBy'],
  ): void {
    records.sort((left, right) => {
      for (const order of orderBy) {
        const leftValue = this.#orderValue(left, order.field);
        const rightValue = this.#orderValue(right, order.field);
        if (leftValue === rightValue) continue;
        const comparison = leftValue < rightValue ? -1 : 1;
        return order.direction === 'asc' ? comparison : -comparison;
      }
      return left.id.localeCompare(right.id);
    });
  }

  #cursorStart(
    records: readonly CrudRecord<TData>[],
    after: string | undefined,
    orderBy: ListRequest<TFilter>['page']['orderBy'],
  ): number {
    if (!after) return 0;
    const cursor = JSON.parse(after) as
      { id?: string; orderBy?: unknown } | undefined;
    if (
      !cursor ||
      typeof cursor.id !== 'string' ||
      JSON.stringify(cursor.orderBy) !== JSON.stringify(orderBy)
    )
      throw this.#failure('validation', 'Invalid in-memory page cursor');
    const index = records.findIndex((record) => record.id === cursor.id);
    if (index < 0)
      throw this.#failure('validation', 'Cursor record was not found');
    return index + 1;
  }

  #nextCursor(
    items: readonly CrudRecord<TData>[],
    orderBy: ListRequest<TFilter>['page']['orderBy'],
  ): string {
    return createPageCursor(
      JSON.stringify({ id: items[items.length - 1].id, orderBy }),
    );
  }

  #orderValue(record: CrudRecord<TData>, field: string): string | number {
    const value = field.split('.').reduce<unknown>((current, segment) => {
      if (!current || typeof current !== 'object') return undefined;
      return (current as Record<string, unknown>)[segment];
    }, record);
    return value as string | number;
  }
}
