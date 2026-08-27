import { signal, type Signal } from '@angular/core';
import type { AuthSessionPort } from '@tankos/authn';
import { createFeedbackService, type FeedbackService } from '@tankos/feedback';
import { createNoopLogger, type Logger } from '@tankos/observability';
import type {
  CustomUnitDefinitionDraft,
  UnitDefinitionManagementService,
  UnitDefinitionRecord,
} from '@tankos/units';
import { createUnitDefinitionListStore } from './unit-definition-list-store';
import type { UnitDefinitionListStore } from './unit-definition-list-store';
import {
  createUnitDefinitionFeatureActions,
  type UnitDefinitionFeatureOperationStatus,
} from './unit-definition-feature-actions';

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
export type FeatureOperationStatus = UnitDefinitionFeatureOperationStatus;

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
    ...createUnitDefinitionFeatureActions(
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
