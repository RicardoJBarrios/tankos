/* eslint-disable max-lines -- feature orchestration keeps the complete unit workflow cohesive. */
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
  CustomUnitDefinitionDraft,
  UnitDefinition,
  UnitDefinitionManagementService,
  UnitDefinitionRecord,
} from '@tankos/units';

const UNIT_DEFINITION_PAGE = {
  pageSize: 50,
  orderBy: [{ field: 'data.code', direction: 'asc' as const }],
};

export interface UnitDefinitionFeatureStore {
  readonly list: UnitDefinitionListStore;
  readonly editingRecord: Signal<UnitDefinitionRecord | undefined>;
  readonly saveError: Signal<unknown>;
  readonly saveStatus: Signal<FeatureOperationStatus>;
  readonly lifecycleError: Signal<unknown>;
  readonly lifecycleStatus: Signal<FeatureOperationStatus>;
  readonly startCreate: () => void;
  readonly startEdit: (record: UnitDefinitionRecord) => void;
  readonly cancelEdit: () => void;
  readonly save: (draft: CustomUnitDefinitionDraft) => void;
  readonly markForDeletion: (record: UnitDefinitionRecord) => Promise<void>;
  readonly restore: (record: UnitDefinitionRecord) => Promise<void>;
  readonly publish: (record: UnitDefinitionRecord) => Promise<void>;
  readonly delete: (record: UnitDefinitionRecord) => Promise<void>;
}

/** State of an asynchronous feature command, independent of its adapter. */
export type FeatureOperationStatus = 'idle' | 'pending' | 'error';

export function createUnitDefinitionFeatureStore(
  service: UnitDefinitionManagementService,
  authSession: AuthSessionPort,
  logger: Logger = createNoopLogger(),
  feedback: FeedbackService = createFeedbackService(),
): UnitDefinitionFeatureStore {
  const rawList = createUnitDefinitionListStore(service, logger);
  const list = createUnitDefinitionListView(rawList, authSession, feedback);
  const editingRecord = signal<UnitDefinitionRecord | undefined>(undefined);
  const saveError = signal<unknown>(undefined);
  const saveStatus = signal<FeatureOperationStatus>('idle');
  const lifecycleError = signal<unknown>(undefined);
  const lifecycleStatus = signal<FeatureOperationStatus>('idle');

  return {
    list,
    editingRecord,
    saveError,
    saveStatus,
    lifecycleError,
    lifecycleStatus,
    ...createUnitDefinitionActions(
      service,
      authSession,
      list,
      rawList,
      editingRecord,
      saveError,
      saveStatus,
      lifecycleError,
      lifecycleStatus,
      logger,
      feedback,
    ),
  };
}

/* eslint-disable max-lines-per-function -- action wiring keeps the feature API explicit. */
function createUnitDefinitionActions(
  service: UnitDefinitionManagementService,
  authSession: AuthSessionPort,
  list: UnitDefinitionListStore,
  rawList: CrudListStoreInstance<UnitDefinition, unknown, unknown>,
  editingRecord: WritableSignal<UnitDefinitionRecord | undefined>,
  saveError: WritableSignal<unknown>,
  saveStatus: WritableSignal<FeatureOperationStatus>,
  lifecycleError: WritableSignal<unknown>,
  lifecycleStatus: WritableSignal<FeatureOperationStatus>,
  logger: Logger,
  feedback: FeedbackService,
): Pick<
  UnitDefinitionFeatureStore,
  | 'startCreate'
  | 'startEdit'
  | 'cancelEdit'
  | 'save'
  | 'markForDeletion'
  | 'restore'
  | 'publish'
  | 'delete'
> {
  return {
    ...createUnitDefinitionEditingActions(editingRecord),
    save: (draft) => {
      logger.debug('Unit definition save started', {
        mode: editingRecord() ? 'replace' : 'create',
      });
      saveError.set(undefined);
      saveStatus.set('pending');
      void saveUnitDefinition(
        service,
        authSession,
        list,
        editingRecord,
        saveError,
        saveStatus,
        draft,
        logger,
        feedback,
      );
    },
    markForDeletion: (record) =>
      runLifecycle(
        rawList,
        authSession,
        record,
        'delete',
        lifecycleError,
        lifecycleStatus,
        logger,
        feedback,
      ),
    restore: (record) =>
      runLifecycle(
        rawList,
        authSession,
        record,
        'restore',
        lifecycleError,
        lifecycleStatus,
        logger,
        feedback,
      ),
    publish: (record) => {
      lifecycleError.set(undefined);
      lifecycleStatus.set('pending');
      return authSession
        .access()
        .then((access) =>
          service.publish({
            access,
            id: record.id,
            expectedRevision: record.revision,
            current: record.data,
            currentLifecycle: record.lifecycle.status,
          }),
        )
        .then(() => list.load(list.filter()))
        .then(() => {
          lifecycleStatus.set('idle');
          feedback.success('Unit published successfully.');
        })
        .catch((error: unknown) => {
          lifecycleStatus.set('error');
          lifecycleError.set(error);
          feedback.error('Unable to publish the unit.');
        });
    },
    delete: (record) => {
      lifecycleError.set(undefined);
      lifecycleStatus.set('pending');
      return authSession
        .access()
        .then((access) =>
          service.delete({
            access,
            id: record.id,
            expectedRevision: record.revision,
          }),
        )
        .then(() => list.load(list.filter()))
        .then(() => {
          lifecycleStatus.set('idle');
          feedback.success('Unit permanently deleted.');
        })
        .catch((error: unknown) => {
          lifecycleStatus.set('error');
          lifecycleError.set(error);
          feedback.error('Unable to delete the unit permanently.');
        });
    },
  };
}
/* eslint-enable max-lines-per-function */

function createUnitDefinitionEditingActions(
  editingRecord: WritableSignal<UnitDefinitionRecord | undefined>,
): Pick<
  UnitDefinitionFeatureStore,
  'startCreate' | 'startEdit' | 'cancelEdit'
> {
  return {
    startCreate: () => {
      editingRecord.set(undefined);
    },
    startEdit: (record) => {
      editingRecord.set(record);
    },
    cancelEdit: () => {
      editingRecord.set(undefined);
    },
  };
}

async function saveUnitDefinition(
  service: UnitDefinitionManagementService,
  authSession: AuthSessionPort,
  list: UnitDefinitionListStore,
  editingRecord: WritableSignal<UnitDefinitionRecord | undefined>,
  saveError: WritableSignal<unknown>,
  saveStatus: WritableSignal<FeatureOperationStatus>,
  draft: CustomUnitDefinitionDraft,
  logger: Logger,
  feedback: FeedbackService,
): Promise<void> {
  try {
    const access = await authSession.access();
    const record = editingRecord();
    if (record) {
      await service.save({
        access,
        id: record.id,
        expectedRevision: record.revision,
        current: record.data,
        draft,
      });
    } else {
      await service.save({ access, draft });
    }
    editingRecord.set(undefined);
    await list.load();
    saveStatus.set('idle');
    feedback.success('Unit saved successfully.');
    logger.debug('Unit definition save completed');
  } catch (error) {
    logger.debug('Unit definition save failed', { error });
    saveStatus.set('error');
    saveError.set(error);
    feedback.error('Unable to save the unit.');
  }
}

function runLifecycle(
  list: CrudListStoreInstance<UnitDefinition, unknown, unknown>,
  authSession: AuthSessionPort,
  record: UnitDefinitionRecord,
  operation: 'delete' | 'restore',
  lifecycleError: WritableSignal<unknown>,
  lifecycleStatus: WritableSignal<FeatureOperationStatus>,
  logger: Logger,
  feedback: FeedbackService,
): Promise<void> {
  logger.debug('Unit definition lifecycle operation started', {
    operation,
    id: record.id,
  });
  lifecycleError.set(undefined);
  lifecycleStatus.set('pending');
  return (async () => {
    try {
      const access = await authSession.access();
      const request = {
        access,
        id: record.id,
        expectedRevision: record.revision,
      };
      const result =
        operation === 'delete'
          ? await list.markForDeletion(request)
          : await list.restore(request);
      if (!result.ok) throw result.error;
      lifecycleStatus.set('idle');
      feedback.success(
        operation === 'delete'
          ? 'Unit moved to the recycle bin.'
          : 'Unit restored successfully.',
      );
      logger.debug('Unit definition lifecycle operation completed', {
        operation,
        id: record.id,
      });
    } catch (error) {
      logger.debug('Unit definition lifecycle operation failed', {
        operation,
        id: record.id,
        error,
      });
      lifecycleStatus.set('error');
      lifecycleError.set(error);
      feedback.error(
        operation === 'delete'
          ? 'Unable to delete the unit.'
          : 'Unable to restore the unit.',
      );
    }
  })();
}

function createUnitDefinitionListView(
  rawList: CrudListStoreInstance<UnitDefinition, unknown, unknown>,
  authSession: AuthSessionPort,
  feedback: FeedbackService,
): UnitDefinitionListStore {
  const accessError = signal<unknown>(undefined);
  let loadQueue = Promise.resolve();

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
    load: (filter) => {
      loadQueue = enqueueListLoad(loadQueue, async () => {
        accessError.set(undefined);
        await authSession
          .access()
          .then((access) => rawList.load(access, filter))
          .catch((error: unknown) => {
            accessError.set(error);
            feedback.error('Unable to load the units.');
          });
      });
      return loadQueue;
    },
    loadMore: () => {
      accessError.set(undefined);
      return authSession
        .access()
        .then((access) => rawList.loadMore(access))
        .then((result) => {
          if (!result.ok) throw result.error;
        })
        .catch((error: unknown) => {
          accessError.set(error);
          feedback.error('Unable to load more units.');
        });
    },
  };
}

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

function enqueueListLoad(
  queue: Promise<void>,
  load: () => Promise<void>,
): Promise<void> {
  return queue.then(load, load);
}

function createUnitDefinitionListStore(
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

function isDeletedUnitFilter(filter: unknown): boolean {
  return (
    typeof filter === 'object' &&
    filter !== null &&
    'lifecycle' in filter &&
    filter.lifecycle === 'marked-for-deletion'
  );
}

export function formatUnitDefinitionLabel(
  record: UnitDefinitionRecord,
): string {
  return `${record.data.code} (${record.data.representation.symbol})`;
}
