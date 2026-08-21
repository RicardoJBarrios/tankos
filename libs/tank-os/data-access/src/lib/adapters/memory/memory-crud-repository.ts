import { DataAccessError } from '../../core/errors';
import type {
  CrudRecord,
  CrudRepositoryPort,
  DataAccessErrorCode,
  GetRequest,
  ListRequest,
  Page,
  RecordCommand,
  PageCursor,
} from '../../core';
import { createPageCursor } from '../../core';
import type { ServerTimestamp } from '../../core';

/** Dependencies needed to create a deterministic in-memory repository. */
export interface InMemoryCrudRepositoryOptions<
  TData,
  TCreate,
  TUpdate,
  TFilter,
> {
  readonly initialRecords?: readonly CrudRecord<TData>[];
  readonly create: (input: TCreate, now: ServerTimestamp) => CrudRecord<TData>;
  readonly update: (data: TData, input: TUpdate) => TData;
  readonly matches?: (record: CrudRecord<TData>, filter: TFilter) => boolean;
  readonly now: () => ServerTimestamp;
}

/** In-memory CRUD adapter for deterministic tests and local prototypes. */
export function createInMemoryCrudRepository<
  TData,
  TCreate,
  TUpdate,
  TFilter = unknown,
>(
  options: InMemoryCrudRepositoryOptions<TData, TCreate, TUpdate, TFilter>,
): CrudRepositoryPort<TData, TCreate, TUpdate, TFilter> {
  const records = new Map(
    (options.initialRecords ?? []).map((record) => [record.id, record]),
  );
  const visibleByDefault = new Set(['active', 'inactive']);

  const failure = (code: DataAccessErrorCode, message: string) =>
    new DataAccessError(code, message, { retryable: code === 'transient' });

  function requireRecord(request: RecordCommand): CrudRecord<TData> {
    const record = records.get(request.id);
    if (!record) {
      throw failure('not-found', `Record ${request.id} was not found`);
    }
    return record;
  }

  function withUpdatedMetadata(record: CrudRecord<TData>, lifecycle = record.lifecycle) {
    return {
      ...record,
      lifecycle,
      version: record.version + 1,
      metadata: { ...record.metadata, updatedAt: options.now() },
    };
  }

  function offsetFromCursor(cursor?: PageCursor): number {
    if (!cursor) return 0;
    const offset = Number(cursor);
    if (!Number.isInteger(offset) || offset < 0) {
      throw failure('validation', 'Invalid in-memory page cursor');
    }
    return offset;
  }

  return {
    async list(request: ListRequest<TFilter>): Promise<Page<CrudRecord<TData>>> {
      const lifecycle = new Set(request.lifecycle ?? [...visibleByDefault]);
      const filtered = [...records.values()].filter(
        (record) =>
          lifecycle.has(record.lifecycle.status) &&
          (request.filter === undefined ||
            options.matches?.(record, request.filter) !== false),
      );
      const offset = offsetFromCursor(request.page.after);
      const items = filtered.slice(offset, offset + request.page.pageSize);
      const hasMore = offset + items.length < filtered.length;
      return {
        items,
        hasMore,
        nextCursor: hasMore
          ? createPageCursor(String(offset + items.length))
          : undefined,
      };
    },
    async get(request: GetRequest) {
      return records.get(request.id);
    },
    async create(input: TCreate) {
      const record = options.create(input, options.now());
      if (records.has(record.id)) {
        throw failure('conflict', `Record ${record.id} already exists`);
      }
      records.set(record.id, record);
      return record;
    },
    async replace(request: RecordCommand, input: TUpdate) {
      const record = requireRecord(request);
      if (record.lifecycle.status === 'deleted') {
        throw failure('lifecycle', `Record ${record.id} is terminally deleted`);
      }
      const replacement = withUpdatedMetadata(record);
      const updated = { ...replacement, data: options.update(record.data, input) };
      records.set(record.id, updated);
      return updated;
    },
    async markForDeletion(request: RecordCommand) {
      const record = requireRecord(request);
      if (record.lifecycle.status === 'deleted') {
        throw failure('lifecycle', `Record ${record.id} is terminally deleted`);
      }
      const updated = withUpdatedMetadata(record, { status: 'marked-for-deletion' });
      records.set(record.id, updated);
      return updated;
    },
    async restore(request: RecordCommand) {
      const record = requireRecord(request);
      if (record.lifecycle.status !== 'marked-for-deletion') {
        throw failure('lifecycle', `Record ${record.id} is not marked for deletion`);
      }
      const updated = withUpdatedMetadata(record, { status: 'active' });
      records.set(record.id, updated);
      return updated;
    },
    async delete(request: RecordCommand) {
      const record = requireRecord(request);
      records.delete(record.id);
    },
  };
}
