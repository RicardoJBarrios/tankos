import type {
  AccessContext,
  BatchOperation,
  BatchProgress,
  BatchService,
  CrudRecord,
  CrudService,
  EntityId,
  PageRequest,
  PageCursor,
} from '@tankos/data-access';
import type { Logger } from '@tankos/observability';

/** State status exposed by the reusable CRUD list store. */
export type CrudListStatus = 'idle' | 'loading' | 'ready' | 'error';

/** Consistent outcome returned by every recoverable CRUD-list operation. */
export type CrudOperationResult<TValue = void> =
  | { readonly ok: true; readonly value: TValue }
  | { readonly ok: false; readonly error: unknown };

/** State owned by one paginated CRUD list flow. */
export interface CrudListState<TData, TFilter> {
  readonly status: CrudListStatus;
  readonly items: readonly CrudRecord<TData>[];
  readonly filter: TFilter | undefined;
  readonly nextCursor: PageCursor | undefined;
  readonly hasMore: boolean;
  readonly selectedIds: readonly EntityId[];
  readonly batch: BatchProgress | undefined;
  readonly error: unknown;
}

/** Dependencies and query defaults used to create a CRUD list store. */
export interface CrudListStoreOptions<
  TData,
  TCreate,
  TUpdate,
  TFilter,
  TPayload = unknown,
> {
  readonly service: CrudService<TData, TCreate, TUpdate, TFilter>;
  readonly page: PageRequest;
  readonly schema: string;
  readonly batch?: BatchService<TPayload, TFilter>;
  /** Optional host logger; absent means no logging. */
  readonly logger?: Logger;
}

/** Request used by a list store to submit a confirmed batch operation. */
export interface CrudListBatchRequest<TFilter, TPayload = unknown> {
  readonly access: AccessContext;
  readonly operation: BatchOperation;
  readonly confirmationToken: string;
  readonly idempotencyKey: string;
  readonly selection:
    | { readonly kind: 'ids'; readonly ids: readonly EntityId[] }
    | {
        readonly kind: 'filter';
        readonly filter: TFilter;
      };
  readonly payload?: TPayload;
}
