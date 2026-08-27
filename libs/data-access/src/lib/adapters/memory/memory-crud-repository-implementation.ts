import { DataAccessError } from '../../core/errors';
import type {
  CrudRecord,
  CreateRequest,
  CrudRepositoryPort,
  DataAccessErrorCode,
  GetRequest,
  ListRequest,
  Page,
  PageCursor,
  RecordCommand,
} from '../../core';
import {
  createPageCursor,
  createAccessContext,
  createPageRequest,
} from '../../core';
import type { InMemoryCrudRepositoryOptions } from './memory-crud-repository';

function failure(code: DataAccessErrorCode, message: string): DataAccessError {
  return new DataAccessError(code, message, {
    retryable: code === 'transient',
  });
}

function validateAccess(
  access: Parameters<typeof createAccessContext>[0],
): void {
  createAccessContext(access);
}

function nextCursor<TData, TFilter>(
  items: readonly CrudRecord<TData>[],
  orderBy: ListRequest<TFilter>['page']['orderBy'],
): PageCursor {
  return createPageCursor(
    JSON.stringify({ id: items[items.length - 1].id, orderBy }),
  );
}

function orderValue<TData>(
  record: CrudRecord<TData>,
  field: string,
): string | number {
  const value = field.split('.').reduce<unknown>((current, segment) => {
    if (!current || typeof current !== 'object') return undefined;
    return (current as Record<string, unknown>)[segment];
  }, record);
  return value as string | number;
}

function requireRevision<TData>(
  record: CrudRecord<TData>,
  request: RecordCommand,
): void {
  if (!Number.isInteger(request.expectedRevision))
    throw failure(
      'validation',
      'Record commands require an integer expectedRevision',
    );
  if (request.expectedRevision !== record.revision)
    throw failure('conflict', `Record ${record.id} revision is stale`);
}

function requireNotDeleted<TData>(record: CrudRecord<TData>): void {
  if (record.lifecycle.status === 'deleted')
    throw failure('lifecycle', `Record ${record.id} is terminally deleted`);
}

function sortRecords<TData, TFilter>(
  records: CrudRecord<TData>[],
  orderBy: ListRequest<TFilter>['page']['orderBy'],
): void {
  records.sort((left, right) => {
    for (const order of orderBy) {
      const leftValue = orderValue(left, order.field);
      const rightValue = orderValue(right, order.field);
      if (leftValue === rightValue) continue;
      const comparison = leftValue < rightValue ? -1 : 1;
      return order.direction === 'asc' ? comparison : -comparison;
    }
    return left.id.localeCompare(right.id);
  });
}

function cursorStart<TData, TFilter>(
  records: readonly CrudRecord<TData>[],
  after: string | undefined,
  orderBy: ListRequest<TFilter>['page']['orderBy'],
): number {
  if (!after) return 0;
  let cursor: { id?: string; orderBy?: unknown } | null;
  try {
    cursor = JSON.parse(after) as { id?: string; orderBy?: unknown } | null;
  } catch {
    throw failure('validation', 'Invalid in-memory page cursor');
  }
  if (!isValidCursor(cursor, orderBy))
    throw failure('validation', 'Invalid in-memory page cursor');
  const index = records.findIndex((record) => record.id === cursor.id);
  if (index < 0) throw failure('validation', 'Cursor record was not found');
  return index + 1;
}

function isValidCursor<TFilter>(
  cursor: { id?: string; orderBy?: unknown } | null,
  orderBy: ListRequest<TFilter>['page']['orderBy'],
): cursor is { id: string; orderBy?: unknown } {
  return (
    cursor !== null &&
    typeof cursor.id === 'string' &&
    JSON.stringify(cursor.orderBy) === JSON.stringify(orderBy)
  );
}

function matchesFilter<TData, TCreate, TUpdate, TFilter>(
  record: CrudRecord<TData>,
  request: ListRequest<TFilter>,
  lifecycle: Set<string>,
  matcher: InMemoryCrudRepositoryOptions<
    TData,
    TCreate,
    TUpdate,
    TFilter
  >['matches'],
): boolean {
  if (!lifecycle.has(record.lifecycle.status)) return false;
  if (request.filter === undefined) return true;
  return matcher?.(record, request.filter) === true;
}

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

  public constructor(
    options: InMemoryCrudRepositoryOptions<TData, TCreate, TUpdate, TFilter>,
  ) {
    this.#options = options;
    this.#records = new Map(
      (this.#options.initialRecords ?? []).map((record) => [record.id, record]),
    );
  }

  public async list(
    request: ListRequest<TFilter>,
  ): Promise<Page<CrudRecord<TData>>> {
    validateAccess(request.access);
    createPageRequest(request.page);
    validateAccess(request.access);
    const lifecycle = new Set(request.lifecycle ?? [...this.#visibleByDefault]);
    const filtered = this.#filterRecords(request, lifecycle);
    sortRecords(filtered, request.page.orderBy);
    const start = cursorStart(
      filtered,
      request.page.after,
      request.page.orderBy,
    );
    const items = filtered.slice(start, start + request.page.pageSize);
    const hasMore = start + items.length < filtered.length;
    return {
      items,
      hasMore,
      nextCursor: hasMore ? nextCursor(items, request.page.orderBy) : undefined,
    };
  }

  public async get(
    request: GetRequest,
  ): Promise<CrudRecord<TData> | undefined> {
    validateAccess(request.access);
    const record = this.#records.get(request.id);
    if (!record) return undefined;
    const lifecycle = new Set(request.lifecycle ?? [...this.#visibleByDefault]);
    return lifecycle.has(record.lifecycle.status) ? record : undefined;
  }

  public async create(
    request: CreateRequest<TCreate>,
  ): Promise<CrudRecord<TData>> {
    validateAccess(request.access);
    const record = this.#options.create(
      request.input,
      this.#options.clock.now(),
    );
    if (this.#records.has(record.id))
      throw failure('conflict', `Record ${record.id} already exists`);
    this.#records.set(record.id, record);
    return record;
  }

  public async replace(
    request: RecordCommand,
    input: TUpdate,
  ): Promise<CrudRecord<TData>> {
    const record = this.#requireRecord(request);
    requireRevision(record, request);
    requireNotDeleted(record);
    const replacement = this.#withUpdatedMetadata(record, request.access);
    const updated = {
      ...replacement,
      data: this.#options.update(record.data, input),
    };
    this.#records.set(record.id, updated);
    return updated;
  }

  public async markForDeletion(
    request: RecordCommand,
  ): Promise<CrudRecord<TData>> {
    const record = this.#requireRecord(request);
    requireRevision(record, request);
    requireNotDeleted(record);
    const updated = this.#withUpdatedMetadata(record, request.access, {
      status: 'marked-for-deletion',
    });
    this.#records.set(record.id, updated);
    return updated;
  }

  public async restore(request: RecordCommand): Promise<CrudRecord<TData>> {
    const record = this.#requireRecord(request);
    requireRevision(record, request);
    if (record.lifecycle.status === 'marked-for-deletion') {
      const updated = this.#withUpdatedMetadata(record, request.access, {
        status: 'active',
      });
      this.#records.set(record.id, updated);
      return updated;
    } else {
      throw failure(
        'lifecycle',
        `Record ${record.id} is not marked for deletion`,
      );
    }
  }

  public async delete(request: RecordCommand): Promise<void> {
    const record = this.#requireRecord(request);
    requireRevision(record, request);
    if (record.lifecycle.status === 'marked-for-deletion') {
      this.#records.delete(record.id);
    } else {
      throw failure(
        'lifecycle',
        `Record ${record.id} must be marked for deletion`,
      );
    }
  }

  #requireRecord(request: RecordCommand): CrudRecord<TData> {
    validateAccess(request.access);
    const record = this.#records.get(request.id);
    if (!record)
      throw failure('not-found', `Record ${request.id} was not found`);
    return record;
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
    if (matcher === undefined && request.filter !== undefined)
      throw failure('validation', 'A filter requires a matcher');
    return [...this.#records.values()].filter((record) =>
      matchesFilter(record, request, lifecycle, matcher),
    );
  }
}
