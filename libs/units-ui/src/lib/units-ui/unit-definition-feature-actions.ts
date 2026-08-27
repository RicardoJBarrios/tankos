import type { WritableSignal } from '@angular/core';
import type { AuthSessionPort } from '@tankos/authn';
import type { CrudListStoreInstance } from '@tankos/data-access-ui';
import type { FeedbackService } from '@tankos/feedback';
import type { Logger } from '@tankos/observability';
import type {
  CustomUnitDefinitionDraft,
  UnitDefinition,
  UnitDefinitionManagementService,
  UnitDefinitionRecord,
} from '@tankos/units';
import type { UnitDefinitionListStore } from './unit-definition-list-store';
import { runUnitDefinitionLifecycle } from './unit-definition-lifecycle-actions';

export type UnitDefinitionFeatureOperationStatus = 'idle' | 'pending' | 'error';

export interface UnitDefinitionFeatureActions {
  readonly startCreate: () => void;
  readonly startEdit: (record: UnitDefinitionRecord) => void;
  readonly cancelEdit: () => void;
  readonly save: (draft: CustomUnitDefinitionDraft) => void;
  readonly markForDeletion: (record: UnitDefinitionRecord) => Promise<void>;
  readonly restore: (record: UnitDefinitionRecord) => Promise<void>;
  readonly publish: (record: UnitDefinitionRecord) => Promise<void>;
  readonly delete: (record: UnitDefinitionRecord) => Promise<void>;
}

export function createUnitDefinitionFeatureActions(
  service: UnitDefinitionManagementService,
  authSession: AuthSessionPort,
  list: UnitDefinitionListStore,
  lifecycle: Pick<
    CrudListStoreInstance<UnitDefinition, unknown, unknown>,
    'markForDeletion' | 'restore'
  >,
  editingRecord: WritableSignal<UnitDefinitionRecord | undefined>,
  saveError: WritableSignal<unknown>,
  saveStatus: WritableSignal<UnitDefinitionFeatureOperationStatus>,
  lifecycleError: WritableSignal<unknown>,
  lifecycleStatus: WritableSignal<UnitDefinitionFeatureOperationStatus>,
  logger: Logger,
  feedback: FeedbackService,
): UnitDefinitionFeatureActions {
  return {
    ...createUnitDefinitionEditingActions(editingRecord),
    ...createUnitDefinitionSaveAction(
      service,
      authSession,
      list,
      editingRecord,
      saveError,
      saveStatus,
      logger,
      feedback,
    ),
    ...createUnitDefinitionLifecycleActions(
      service,
      authSession,
      list,
      lifecycle,
      lifecycleError,
      lifecycleStatus,
      logger,
      feedback,
    ),
  };
}

function createUnitDefinitionSaveAction(
  service: UnitDefinitionManagementService,
  authSession: AuthSessionPort,
  list: UnitDefinitionListStore,
  editingRecord: WritableSignal<UnitDefinitionRecord | undefined>,
  saveError: WritableSignal<unknown>,
  saveStatus: WritableSignal<UnitDefinitionFeatureOperationStatus>,
  logger: Logger,
  feedback: FeedbackService,
): Pick<UnitDefinitionFeatureActions, 'save'> {
  return {
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
  };
}

function createUnitDefinitionLifecycleActions(
  service: UnitDefinitionManagementService,
  authSession: AuthSessionPort,
  list: UnitDefinitionListStore,
  lifecycle: Pick<
    CrudListStoreInstance<UnitDefinition, unknown, unknown>,
    'markForDeletion' | 'restore'
  >,
  lifecycleError: WritableSignal<unknown>,
  lifecycleStatus: WritableSignal<UnitDefinitionFeatureOperationStatus>,
  logger: Logger,
  feedback: FeedbackService,
): Pick<
  UnitDefinitionFeatureActions,
  'markForDeletion' | 'restore' | 'publish' | 'delete'
> {
  return {
    markForDeletion: (record) => {
      return runUnitDefinitionLifecycle(
        lifecycle,
        authSession,
        record,
        'delete',
        lifecycleError,
        lifecycleStatus,
        logger,
        feedback,
      );
    },
    restore: (record) => {
      return runUnitDefinitionLifecycle(
        lifecycle,
        authSession,
        record,
        'restore',
        lifecycleError,
        lifecycleStatus,
        logger,
        feedback,
      );
    },
    ...createUnitDefinitionPublishAction(
      service,
      authSession,
      list,
      lifecycleError,
      lifecycleStatus,
      feedback,
    ),
    ...createUnitDefinitionPhysicalDeleteAction(
      service,
      authSession,
      list,
      lifecycleError,
      lifecycleStatus,
      feedback,
    ),
  };
}

function createUnitDefinitionPublishAction(
  service: UnitDefinitionManagementService,
  authSession: AuthSessionPort,
  list: UnitDefinitionListStore,
  lifecycleError: WritableSignal<unknown>,
  lifecycleStatus: WritableSignal<UnitDefinitionFeatureOperationStatus>,
  feedback: FeedbackService,
): Pick<UnitDefinitionFeatureActions, 'publish'> {
  return {
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
  };
}

function createUnitDefinitionPhysicalDeleteAction(
  service: UnitDefinitionManagementService,
  authSession: AuthSessionPort,
  list: UnitDefinitionListStore,
  lifecycleError: WritableSignal<unknown>,
  lifecycleStatus: WritableSignal<UnitDefinitionFeatureOperationStatus>,
  feedback: FeedbackService,
): Pick<UnitDefinitionFeatureActions, 'delete'> {
  return {
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

function createUnitDefinitionEditingActions(
  editingRecord: WritableSignal<UnitDefinitionRecord | undefined>,
): Pick<
  UnitDefinitionFeatureActions,
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
  saveStatus: WritableSignal<UnitDefinitionFeatureOperationStatus>,
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
