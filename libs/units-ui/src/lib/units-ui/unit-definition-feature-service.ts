import type { Signal } from '@angular/core';
import type { AuthSessionPort } from '@tankos/auth';
import type {
  CustomUnitDefinitionDraft,
  UnitDefinitionManagementService,
  UnitDefinitionRecord,
} from '@tankos/units';
import {
  createUnitDefinitionFeatureStore,
  formatUnitDefinitionLabel,
  type FeatureOperationStatus,
  type UnitDefinitionFeatureStore,
  type UnitDefinitionListStore,
} from './unit-definition-feature-store';

/** UI-facing orchestration API; the underlying store remains private. */
export class UnitDefinitionFeatureService {
  public readonly list: UnitDefinitionListStore;
  public readonly editingRecord: Signal<UnitDefinitionRecord | undefined>;
  public readonly saveError: Signal<unknown>;
  public readonly saveStatus: Signal<FeatureOperationStatus>;
  public readonly lifecycleError: Signal<unknown>;
  public readonly lifecycleStatus: Signal<FeatureOperationStatus>;
  public readonly label = formatUnitDefinitionLabel;

  readonly #store: UnitDefinitionFeatureStore;

  public constructor(
    managementService: UnitDefinitionManagementService,
    authSession: AuthSessionPort,
  ) {
    this.#store = createUnitDefinitionFeatureStore(
      managementService,
      authSession,
    );
    this.list = this.#store.list;
    this.editingRecord = this.#store.editingRecord;
    this.saveError = this.#store.saveError;
    this.saveStatus = this.#store.saveStatus;
    this.lifecycleError = this.#store.lifecycleError;
    this.lifecycleStatus = this.#store.lifecycleStatus;
  }

  public load(): void {
    void this.list.load();
  }

  public startCreate(): void {
    this.#store.startCreate();
  }

  public startEdit(record: UnitDefinitionRecord): void {
    this.#store.startEdit(record);
  }

  public cancelEdit(): void {
    this.#store.cancelEdit();
  }

  public save(draft: CustomUnitDefinitionDraft): void {
    this.#store.save(draft);
  }

  public markForDeletion(record: UnitDefinitionRecord): void {
    this.#store.markForDeletion(record);
  }

  public restore(record: UnitDefinitionRecord): void {
    this.#store.restore(record);
  }
}
