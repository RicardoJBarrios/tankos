import { signal, type Signal, type WritableSignal } from '@angular/core';
import type { AuthSessionPort } from '@tankos/authn';
import { createFeedbackService, type FeedbackService } from '@tankos/feedback';
import { createNoopLogger, type Logger } from '@tankos/observability';
import type { CrudListStoreInstance } from '@tankos/data-access-ui';
import type {
  CustomUnitDefinitionDraft,
  UnitDefinition,
  UnitDefinitionManagementService,
  UnitDefinitionRecord,
} from '@tankos/units';
import { createUnitDefinitionListStore } from './unit-definition-list-store';
import type { UnitDefinitionListStore } from './unit-definition-list-store';
import { runUnitDefinitionLifecycle } from './unit-definition-lifecycle-actions';

export {
  formatUnitDefinitionLabel,
  type UnitDefinitionListStore,
} from './unit-definition-list-store';

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
  const listParts = createUnitDefinitionListStore(
    service,
    authSession,
    logger,
    feedback,
  );
  const list = listParts.list;
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
      listParts.lifecycle,
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
  lifecycle: Pick<
    CrudListStoreInstance<UnitDefinition, unknown, unknown>,
    'markForDeletion' | 'restore'
  >,
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
      runUnitDefinitionLifecycle(
        lifecycle,
        authSession,
        record,
        'delete',
        lifecycleError,
        lifecycleStatus,
        logger,
        feedback,
      ),
    restore: (record) =>
      runUnitDefinitionLifecycle(
        lifecycle,
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
