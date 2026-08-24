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
import type { ClockPort } from '@tank-os/time';
import { createPageCursor } from '../../core';
import type { TechnicalTimestamp } from '../../core';
import { createAccessContext, createPageRequest } from '../../core';

/** Dependencies needed to create a deterministic in-memory repository. */
export interface InMemoryCrudRepositoryOptions<
  TData,
  TCreate,
  TUpdate,
  TFilter,
> {
  readonly initialRecords?: readonly CrudRecord<TData>[];
  readonly create: (
    input: TCreate,
    now: TechnicalTimestamp,
  ) => CrudRecord<TData>;
  readonly update: (data: TData, input: TUpdate) => TData;
  readonly matches?: (record: CrudRecord<TData>, filter: TFilter) => boolean;
  readonly clock: ClockPort;
  /** Roles allowed to perform lifecycle operations in this test adapter. */
  readonly elevatedRoles?: readonly string[];
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
  const elevatedRoles = new Set(
    options.elevatedRoles ?? ['moderator', 'administrator', 'worker'],
  );

  const failure = (code: DataAccessErrorCode, message: string) =>
    new DataAccessError(code, message, { retryable: code === 'transient' });

  const validateAccess = (access: Parameters<typeof createAccessContext>[0]) =>
    createAccessContext(access);

  const requireLifecycleRole = (
    access: Parameters<typeof createAccessContext>[0],
  ) => {
    validateAccess(access);
    if (!access.roles.some((role) => elevatedRoles.has(role))) {
      throw failure(
        'forbidden',
        'Lifecycle operations require an elevated role',
      );
    }
  };

  function requireRecord(request: RecordCommand): CrudRecord<TData> {
    validateAccess(request.access);
    const record = records.get(request.id);
    if (!record) {
      throw failure('not-found', `Record ${request.id} was not found`);
    }
    return record;
  }

  function validateLifecycleSelection(
    access: Parameters<typeof createAccessContext>[0],
    lifecycle: readonly string[] | undefined,
  ): void {
    if (lifecycle?.some((status) => !visibleByDefault.has(status))) {
      requireLifecycleRole(access);
    }
  }

  function requireRevision(
    record: CrudRecord<TData>,
    request: RecordCommand,
  ): void {
    if (!Number.isInteger(request.expectedRevision)) {
      throw failure(
        'validation',
        'Record commands require an integer expectedRevision',
      );
    }
    if (request.expectedRevision !== record.revision) {
      throw failure('conflict', `Record ${record.id} revision is stale`);
    }
  }

  function withUpdatedMetadata(
    record: CrudRecord<TData>,
    access: RecordCommand['access'],
    lifecycle = record.lifecycle,
  ) {
    return {
      ...record,
      lifecycle,
      revision: record.revision + 1,
      metadata: {
        ...record.metadata,
        updatedAt: options.clock.now(),
        updatedBy: access.principalId,
        ...(lifecycle.status !== record.lifecycle.status
          ? {
              lifecycleChangedAt: options.clock.now(),
              lifecycleChangedBy: access.principalId,
            }
          : {}),
      },
    };
  }

  function orderValue(
    record: CrudRecord<TData>,
    field: string,
  ): string | number {
    const value = field.split('.').reduce<unknown>((current, segment) => {
      if (!current || typeof current !== 'object') return undefined;
      return (current as Record<string, unknown>)[segment];
    }, record);
    return value as string | number;
  }

  return {
    async list(
      request: ListRequest<TFilter>,
    ): Promise<Page<CrudRecord<TData>>> {
      validateAccess(request.access);
      createPageRequest(request.page);
      validateLifecycleSelection(request.access, request.lifecycle);
      const lifecycle = new Set(request.lifecycle ?? [...visibleByDefault]);
      const matcher = options.matches;
      if (request.filter !== undefined && matcher === undefined) {
        throw failure('validation', 'A filter requires a matcher');
      }
      const filtered = [...records.values()].filter((record) => {
        if (!lifecycle.has(record.lifecycle.status)) return false;
        if (request.filter === undefined) return true;
        return (matcher as NonNullable<typeof matcher>)(record, request.filter);
      });
      filtered.sort((left, right) => {
        for (const order of request.page.orderBy) {
          const leftValue = orderValue(left, order.field);
          const rightValue = orderValue(right, order.field);
          if (leftValue === rightValue) continue;
          const comparison = leftValue < rightValue ? -1 : 1;
          return order.direction === 'asc' ? comparison : -comparison;
        }
        return left.id.localeCompare(right.id);
      });
      let start = 0;
      if (request.page.after) {
        const cursor = JSON.parse(request.page.after) as
          { id?: string; orderBy?: unknown } | undefined;
        if (
          !cursor ||
          typeof cursor.id !== 'string' ||
          JSON.stringify(cursor.orderBy) !==
            JSON.stringify(request.page.orderBy)
        ) {
          throw failure('validation', 'Invalid in-memory page cursor');
        }
        const cursorIndex = filtered.findIndex(
          (record) => record.id === cursor.id,
        );
        if (cursorIndex < 0)
          throw failure('validation', 'Cursor record was not found');
        start = cursorIndex + 1;
      }
      const items = filtered.slice(start, start + request.page.pageSize);
      const hasMore = start + items.length < filtered.length;
      return {
        items,
        hasMore,
        nextCursor: hasMore
          ? createPageCursor(
              JSON.stringify({
                id: items[items.length - 1].id,
                orderBy: request.page.orderBy,
              }),
            )
          : undefined,
      };
    },
    async get(request: GetRequest) {
      validateAccess(request.access);
      validateLifecycleSelection(request.access, request.lifecycle);
      const record = records.get(request.id);
      if (!record) return undefined;
      const lifecycle = new Set(request.lifecycle ?? [...visibleByDefault]);
      return lifecycle.has(record.lifecycle.status) ? record : undefined;
    },
    async create(request: CreateRequest<TCreate>) {
      validateAccess(request.access);
      const record = options.create(request.input, options.clock.now());
      if (records.has(record.id)) {
        throw failure('conflict', `Record ${record.id} already exists`);
      }
      records.set(record.id, record);
      return record;
    },
    async replace(request: RecordCommand, input: TUpdate) {
      const record = requireRecord(request);
      requireRevision(record, request);
      if (record.lifecycle.status === 'deleted') {
        throw failure('lifecycle', `Record ${record.id} is terminally deleted`);
      }
      const replacement = withUpdatedMetadata(record, request.access);
      const updated = {
        ...replacement,
        data: options.update(record.data, input),
      };
      records.set(record.id, updated);
      return updated;
    },
    async markForDeletion(request: RecordCommand) {
      requireLifecycleRole(request.access);
      const record = requireRecord(request);
      requireRevision(record, request);
      if (record.lifecycle.status === 'deleted') {
        throw failure('lifecycle', `Record ${record.id} is terminally deleted`);
      }
      const updated = withUpdatedMetadata(record, request.access, {
        status: 'marked-for-deletion',
      });
      records.set(record.id, updated);
      return updated;
    },
    async restore(request: RecordCommand) {
      requireLifecycleRole(request.access);
      const record = requireRecord(request);
      requireRevision(record, request);
      if (record.lifecycle.status !== 'marked-for-deletion') {
        throw failure(
          'lifecycle',
          `Record ${record.id} is not marked for deletion`,
        );
      }
      const updated = withUpdatedMetadata(record, request.access, {
        status: 'active',
      });
      records.set(record.id, updated);
      return updated;
    },
    async delete(request: RecordCommand) {
      requireLifecycleRole(request.access);
      const record = requireRecord(request);
      requireRevision(record, request);
      if (record.lifecycle.status !== 'marked-for-deletion') {
        throw failure(
          'lifecycle',
          `Record ${record.id} must be marked for deletion`,
        );
      }
      records.delete(record.id);
    },
  };
}
