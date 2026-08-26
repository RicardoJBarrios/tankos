import { computed, type Type, type Signal } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import type { StateSignals, WritableStateSource } from '@ngrx/signals';
import type {
  AccessContext,
  CrudRecord,
  EntityId,
  PageCursor,
} from '@tankos/data-access';
import type { BatchProgress } from '@tankos/data-access';
import { createNoopLogger } from '@tankos/observability';
import type {
  CrudListBatchRequest,
  CrudOperationResult,
  CrudListStatus,
  CrudListState,
  CrudListStoreOptions,
} from './crud-list-contract';

/** Public instance surface returned by the CRUD list store factory. */
export interface CrudListStoreInstance<TData, TFilter, TPayload> {
  readonly status: Signal<CrudListStatus>;
  readonly items: Signal<readonly CrudRecord<TData>[]>;
  readonly filter: Signal<TFilter | undefined>;
  readonly nextCursor: Signal<PageCursor | undefined>;
  readonly hasMore: Signal<boolean>;
  readonly selectedIds: Signal<readonly EntityId[]>;
  readonly batch: Signal<BatchProgress | undefined>;
  readonly error: Signal<unknown>;
  readonly isEmpty: Signal<boolean>;
  readonly canLoadMore: Signal<boolean>;
  readonly hasRunningBatch: Signal<boolean>;
  readonly load: (
    access: AccessContext,
    filter?: TFilter,
  ) => Promise<CrudOperationResult>;
  readonly loadMore: (access: AccessContext) => Promise<CrudOperationResult>;
  readonly setFilter: (filter: TFilter | undefined) => void;
  readonly toggleSelection: (id: EntityId) => void;
  readonly clearSelection: () => void;
  readonly markForDeletion: (
    request: CrudListLifecycleRequest,
  ) => Promise<CrudOperationResult>;
  readonly restore: (
    request: CrudListLifecycleRequest,
  ) => Promise<CrudOperationResult>;
  readonly submitBatch: (
    request: CrudListBatchRequest<TFilter, TPayload>,
  ) => Promise<CrudOperationResult<BatchProgress>>;
  readonly updateBatch: (progress: BatchProgress) => void;
}

/** Request shared by the logical deletion and restoration commands. */
export interface CrudListLifecycleRequest {
  readonly access: AccessContext;
  readonly id: EntityId;
  readonly expectedRevision: number;
}

type CrudListStoreSource<TData, TFilter> = StateSignals<
  CrudListState<TData, TFilter>
> &
  WritableStateSource<CrudListState<TData, TFilter>>;

function pageRequest<TData, TCreate, TUpdate, TFilter, TPayload>(
  options: CrudListStoreOptions<TData, TCreate, TUpdate, TFilter, TPayload>,
  after?: PageCursor,
) {
  return { ...options.page, ...(after ? { after } : {}) };
}

async function loadCrudList<TData, TCreate, TUpdate, TFilter, TPayload>(
  store: CrudListStoreSource<TData, TFilter>,
  options: CrudListStoreOptions<TData, TCreate, TUpdate, TFilter, TPayload>,
  access: AccessContext,
  filter?: TFilter,
  append = false,
): Promise<CrudOperationResult> {
  const logger = options.logger ?? createNoopLogger();
  logger.debug('CRUD list load started', { append });
  patchState(store, { status: 'loading', error: undefined });
  try {
    const page = await options.service.list({
      access,
      filter,
      page: pageRequest(options, append ? store.nextCursor() : undefined),
      ...(options.lifecycle ? { lifecycle: options.lifecycle } : {}),
    });
    patchState(store, {
      status: 'ready',
      items: append ? [...store.items(), ...page.items] : page.items,
      filter,
      nextCursor: page.nextCursor,
      hasMore: page.hasMore,
    });
    logger.debug('CRUD list load completed', {
      append,
      itemCount: page.items.length,
      hasMore: page.hasMore,
    });
    return { ok: true, value: undefined };
  } catch (error) {
    logger.debug('CRUD list load failed', { append, error });
    patchState(store, { status: 'error', error });
    return { ok: false, error };
  }
}

async function reloadCrudList<TData, TCreate, TUpdate, TFilter, TPayload>(
  store: CrudListStoreSource<TData, TFilter>,
  options: CrudListStoreOptions<TData, TCreate, TUpdate, TFilter, TPayload>,
  access: AccessContext,
): Promise<void> {
  const result = await loadCrudList(store, options, access, store.filter());
  if (!result.ok) throw result.error;
}

function createCrudListLoadMethods<TData, TCreate, TUpdate, TFilter, TPayload>(
  store: CrudListStoreSource<TData, TFilter>,
  options: CrudListStoreOptions<TData, TCreate, TUpdate, TFilter, TPayload>,
) {
  return {
    load: (access: AccessContext, filter?: TFilter) =>
      loadCrudList(store, options, access, filter),
    loadMore: (access: AccessContext): Promise<CrudOperationResult> => {
      if (shouldSkipLoadMore(store))
        return Promise.resolve({ ok: true, value: undefined });
      return loadCrudList(store, options, access, store.filter(), true);
    },
  };
}

function shouldSkipLoadMore<TData, TFilter>(
  store: CrudListStoreSource<TData, TFilter>,
): boolean {
  return (
    !store.hasMore() || !store.nextCursor() || store.status() === 'loading'
  );
}

function createCrudListSelectionMethods<TData, TFilter>(
  store: CrudListStoreSource<TData, TFilter>,
) {
  return {
    toggleSelection: (id: EntityId) => {
      const selected = store.selectedIds();
      patchState(store, {
        selectedIds: selected.includes(id)
          ? selected.filter((selectedId) => selectedId !== id)
          : [...selected, id],
      });
    },
    clearSelection: () => {
      patchState(store, { selectedIds: [] });
    },
  };
}

function createCrudListLifecycleMethods<
  TData,
  TCreate,
  TUpdate,
  TFilter,
  TPayload,
>(
  store: CrudListStoreSource<TData, TFilter>,
  options: CrudListStoreOptions<TData, TCreate, TUpdate, TFilter, TPayload>,
) {
  return {
    markForDeletion: (
      request: CrudListLifecycleRequest,
    ): Promise<CrudOperationResult> => {
      const logger = options.logger ?? createNoopLogger();
      logger.debug('CRUD list deletion requested', { id: request.id });
      return runCrudOperation(store, async () => {
        await options.service.markForDeletion(request);
        await reloadCrudList(store, options, request.access);
      });
    },
    restore: (
      request: CrudListLifecycleRequest,
    ): Promise<CrudOperationResult> => {
      const logger = options.logger ?? createNoopLogger();
      logger.debug('CRUD list restoration requested', { id: request.id });
      return runCrudOperation(store, async () => {
        await options.service.restore(request);
        await reloadCrudList(store, options, request.access);
      });
    },
  };
}

async function runCrudOperation<TData, TFilter>(
  store: CrudListStoreSource<TData, TFilter>,
  operation: () => Promise<void>,
): Promise<CrudOperationResult> {
  patchState(store, { error: undefined });
  try {
    await operation();
  } catch (error) {
    patchState(store, { error });
    return { ok: false, error };
  }
  return { ok: true, value: undefined };
}

function createCrudListBatchMethods<TData, TCreate, TUpdate, TFilter, TPayload>(
  store: CrudListStoreSource<TData, TFilter>,
  options: CrudListStoreOptions<TData, TCreate, TUpdate, TFilter, TPayload>,
) {
  return {
    submitBatch: async (
      request: CrudListBatchRequest<TFilter, TPayload>,
    ): Promise<CrudOperationResult<BatchProgress>> => {
      if (!options.batch)
        throw new Error('This CRUD list has no batch capability');
      patchState(store, { error: undefined });
      try {
        const progress = await options.batch.submit({
          access: request.access,
          schema: options.schema,
          operation: request.operation,
          confirmationToken: request.confirmationToken,
          idempotencyKey: request.idempotencyKey,
          selection: request.selection,
          payload: request.payload,
        });
        patchState(store, { batch: progress, selectedIds: [] });
        return { ok: true, value: progress };
      } catch (error) {
        patchState(store, { error });
        return { ok: false, error };
      }
    },
    updateBatch: (progress: BatchProgress) => {
      patchState(store, { batch: progress });
    },
  };
}

function createInitialState(): CrudListState<unknown, unknown> {
  return {
    status: 'idle',
    items: [],
    filter: undefined,
    nextCursor: undefined,
    hasMore: Boolean(0),
    /* c8 ignore next -- V8 maps the erased generic argument as a synthetic branch. */
    selectedIds: new Array<EntityId>(),
    batch: undefined,
    /* c8 ignore next -- V8 reports the object-literal closing token as a synthetic branch. */
    error: undefined,
    /* c8 ignore next -- V8 maps the object-literal closing token as a synthetic branch. */
  };
}

/** Creates a Signal Store for the standard paginated CRUD list flow. */
export function createCrudListStore<
  TData,
  TCreate,
  TUpdate,
  TFilter,
  TPayload = unknown,
>(
  options: CrudListStoreOptions<TData, TCreate, TUpdate, TFilter, TPayload>,
  /* c8 ignore next */
): Type<CrudListStoreInstance<TData, TFilter, TPayload>> {
  /* c8 ignore next 3 */
  return signalStore(
    withState(createInitialState() as CrudListState<TData, TFilter>),
    /* c8 ignore next 3 */
    withComputed((store) => ({
      isEmpty: computed(
        () => store.items().length === 0 && store.status() === 'ready',
      ),
      canLoadMore: computed(
        () => store.hasMore() && store.status() !== 'loading',
      ),
      hasRunningBatch: computed(() => {
        const current = store.batch();
        return (
          current?.status === 'materializing' ||
          current?.status === 'queued' ||
          current?.status === 'running'
        );
      }),
    })),
    withMethods((store) => ({
      ...createCrudListLoadMethods(store, options),
      setFilter: (filter: TFilter | undefined) => {
        patchState(store, { filter });
      },
      ...createCrudListSelectionMethods(store),
      ...createCrudListLifecycleMethods(store, options),
      ...createCrudListBatchMethods(store, options),
    })),
  );
}

/** Public signal shape used by headless CRUD views. */
export interface CrudListSignals<TData, TFilter> {
  readonly items: Signal<readonly CrudRecord<TData>[]>;
  readonly filter: Signal<TFilter | undefined>;
  readonly selectedIds: Signal<readonly EntityId[]>;
}
