import {
  computed,
  signal,
  type Signal,
  type WritableSignal,
} from '@angular/core';
import type { AuthSessionPort } from '@tankos/authn';
import { createFeedbackService, type FeedbackService } from '@tankos/feedback';
import { createNoopLogger, type Logger } from '@tankos/observability';
import {
  createCrudListStore,
  type CrudListStoreInstance,
} from '@tankos/data-access-ui';
import type {
  CrudListLifecycleRequest,
  CrudOperationResult,
} from '@tankos/data-access-ui';
import type {
  UnitDefinition,
  UnitDefinitionManagementService,
  UnitDefinitionRecord,
} from '@tankos/units';

const UNIT_DEFINITION_PAGE = {
  pageSize: 50,
  orderBy: [{ field: 'data.code', direction: 'asc' as const }],
};

export type UnitDefinitionListStore = Omit<
  CrudListStoreInstance<UnitDefinition, unknown, unknown>,
  | 'load'
  | 'loadMore'
  | 'markForDeletion'
  | 'restore'
  | 'submitBatch'
  | 'updateBatch'
> & {
  readonly load: (filter?: unknown) => Promise<void>;
  readonly loadMore: () => Promise<void>;
};

export interface UnitDefinitionListStoreParts {
  readonly list: UnitDefinitionListStore;
  readonly lifecycle: Pick<
    CrudListStoreInstance<UnitDefinition, unknown, unknown>,
    'markForDeletion' | 'restore'
  >;
}

export function createUnitDefinitionListStore(
  service: UnitDefinitionManagementService,
  authSession: AuthSessionPort,
  logger: Logger = createNoopLogger(),
  feedback: FeedbackService = createFeedbackService(),
): UnitDefinitionListStoreParts {
  const rawList = createRawUnitDefinitionList(service, logger);
  const list = createUnitDefinitionListView(rawList, authSession, feedback);
  return {
    list,
    lifecycle: {
      markForDeletion: (
        request: CrudListLifecycleRequest,
      ): Promise<CrudOperationResult> => rawList.markForDeletion(request),
      restore: (
        request: CrudListLifecycleRequest,
      ): Promise<CrudOperationResult> => rawList.restore(request),
    },
  };
}

function createRawUnitDefinitionList(
  service: UnitDefinitionManagementService,
  logger: Logger,
): CrudListStoreInstance<UnitDefinition, unknown, unknown> {
  return new (createCrudListStore<
    UnitDefinition,
    UnitDefinition,
    UnitDefinition,
    unknown
  >({
    service,
    logger,
    page: UNIT_DEFINITION_PAGE,
    schema: 'unit-definition',
    lifecycle: (filter) =>
      isDeletedUnitFilter(filter)
        ? ['marked-for-deletion']
        : ['active', 'inactive'],
  }))();
}

function createUnitDefinitionListView(
  rawList: CrudListStoreInstance<UnitDefinition, unknown, unknown>,
  authSession: AuthSessionPort,
  feedback: FeedbackService,
): UnitDefinitionListStore {
  const accessError = signal<unknown>(undefined);
  let loadQueue = Promise.resolve();
  return {
    ...createUnitDefinitionListSignals(rawList, accessError),
    load: (filter) => {
      loadQueue = enqueueListLoad(loadQueue, () =>
        loadUnitDefinitionList(
          rawList,
          authSession,
          feedback,
          accessError,
          filter,
        ),
      );
      return loadQueue;
    },
    loadMore: () =>
      loadMoreUnitDefinitionList(rawList, authSession, feedback, accessError),
  };
}

async function loadUnitDefinitionList(
  rawList: CrudListStoreInstance<UnitDefinition, unknown, unknown>,
  authSession: AuthSessionPort,
  feedback: FeedbackService,
  accessError: WritableSignal<unknown>,
  filter?: unknown,
): Promise<void> {
  accessError.set(undefined);
  await authSession
    .access()
    .then((access) => rawList.load(access, filter))
    .catch((error: unknown) => {
      accessError.set(error);
      feedback.error('Unable to load the units.');
    });
}

async function loadMoreUnitDefinitionList(
  rawList: CrudListStoreInstance<UnitDefinition, unknown, unknown>,
  authSession: AuthSessionPort,
  feedback: FeedbackService,
  accessError: WritableSignal<unknown>,
): Promise<void> {
  accessError.set(undefined);
  try {
    const result = await authSession
      .access()
      .then((access) => rawList.loadMore(access));
    if (!result.ok) throw result.error;
  } catch (error) {
    accessError.set(error);
    feedback.error('Unable to load more units.');
  }
}

function createUnitDefinitionListSignals(
  rawList: CrudListStoreInstance<UnitDefinition, unknown, unknown>,
  accessError: Signal<unknown>,
): Omit<UnitDefinitionListStore, 'load' | 'loadMore'> {
  return {
    status: computed(() => (accessError() ? 'error' : rawList.status())),
    items: rawList.items,
    filter: rawList.filter,
    nextCursor: rawList.nextCursor,
    hasMore: rawList.hasMore,
    selectedIds: rawList.selectedIds,
    batch: rawList.batch,
    error: computed(() => accessError() ?? rawList.error()),
    isEmpty: rawList.isEmpty,
    canLoadMore: rawList.canLoadMore,
    hasRunningBatch: rawList.hasRunningBatch,
    setFilter: rawList.setFilter,
    toggleSelection: rawList.toggleSelection,
    clearSelection: rawList.clearSelection,
  };
}

function enqueueListLoad(
  queue: Promise<void>,
  load: () => Promise<void>,
): Promise<void> {
  return queue.then(load, load);
}

function isDeletedUnitFilter(filter: unknown): boolean {
  return (
    typeof filter === 'object' &&
    filter !== null &&
    'lifecycle' in filter &&
    filter.lifecycle === 'marked-for-deletion'
  );
}

/** Formats the stable identifier and its human-readable symbol for UI labels. */
export function formatUnitDefinitionLabel(
  record: UnitDefinitionRecord,
): string {
  return `${record.data.code} (${record.data.representation.symbol})`;
}
