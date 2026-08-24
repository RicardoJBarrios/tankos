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

/** State status exposed by the reusable CRUD list store. */
export type CrudListStatus = 'idle' | 'loading' | 'ready' | 'error';

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
