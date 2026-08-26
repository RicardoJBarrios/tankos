import {
  InjectionToken,
  computed,
  signal,
  type Signal,
  type WritableSignal,
} from '@angular/core';
import type { AuthSessionPort } from '@tankos/auth';
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
  readonly markForDeletion: (record: UnitDefinitionRecord) => void;
  readonly restore: (record: UnitDefinitionRecord) => void;
}

/** State of an asynchronous feature command, independent of its adapter. */
export type FeatureOperationStatus = 'idle' | 'pending' | 'error';

export const UNIT_DEFINITION_MANAGEMENT_SERVICE =
  new InjectionToken<UnitDefinitionManagementService>(
    'UNIT_DEFINITION_MANAGEMENT_SERVICE',
  );

export function createUnitDefinitionFeatureStore(
  service: UnitDefinitionManagementService,
  authSession: AuthSessionPort,
): UnitDefinitionFeatureStore {
  const rawList = createUnitDefinitionListStore(service);
  const list = createUnitDefinitionListView(rawList, authSession);
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
    ),
  };
}

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
): Pick<
  UnitDefinitionFeatureStore,
  | 'startCreate'
  | 'startEdit'
  | 'cancelEdit'
  | 'save'
  | 'markForDeletion'
  | 'restore'
> {
  return {
    ...createUnitDefinitionEditingActions(editingRecord),
    save: (draft) => {
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
      );
    },
    markForDeletion: (record) => {
      runLifecycle(
        rawList,
        authSession,
        record,
        'delete',
        lifecycleError,
        lifecycleStatus,
      );
    },
    restore: (record) => {
      runLifecycle(
        rawList,
        authSession,
        record,
        'restore',
        lifecycleError,
        lifecycleStatus,
      );
    },
  };
}

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
): Promise<void> {
  try {
    const access = await authSession.access();
    const record = editingRecord();
    if (record) {
      await service.save({
        access,
        id: record.id,
        expectedRevision: record.revision,
        draft,
      });
    } else {
      await service.save({ access, draft });
    }
    editingRecord.set(undefined);
    await list.load();
    saveStatus.set('idle');
  } catch (error) {
    saveStatus.set('error');
    saveError.set(error);
  }
}

function runLifecycle(
  list: CrudListStoreInstance<UnitDefinition, unknown, unknown>,
  authSession: AuthSessionPort,
  record: UnitDefinitionRecord,
  operation: 'delete' | 'restore',
  lifecycleError: WritableSignal<unknown>,
  lifecycleStatus: WritableSignal<FeatureOperationStatus>,
): void {
  lifecycleError.set(undefined);
  lifecycleStatus.set('pending');
  void (async () => {
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
    } catch (error) {
      lifecycleStatus.set('error');
      lifecycleError.set(error);
    }
  })();
}

function createUnitDefinitionListView(
  rawList: CrudListStoreInstance<UnitDefinition, unknown, unknown>,
  authSession: AuthSessionPort,
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
          });
      });
      return loadQueue;
    },
    loadMore: () => {
      accessError.set(undefined);
      void authSession
        .access()
        .then((access) => rawList.loadMore(access))
        .catch((error: unknown) => {
          accessError.set(error);
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
  readonly loadMore: () => void;
};

function enqueueListLoad(
  queue: Promise<void>,
  load: () => Promise<void>,
): Promise<void> {
  return queue.then(load, load);
}

function createUnitDefinitionListStore(
  service: UnitDefinitionManagementService,
): CrudListStoreInstance<UnitDefinition, unknown, unknown> {
  return new (createCrudListStore<
    UnitDefinition,
    UnitDefinition,
    UnitDefinition,
    unknown
  >({
    service,
    page: UNIT_DEFINITION_PAGE,
    schema: 'unit-definition',
  }))();
}

export function formatUnitDefinitionLabel(
  record: UnitDefinitionRecord,
): string {
  return `${record.data.code} (${record.data.representation.symbol})`;
}
