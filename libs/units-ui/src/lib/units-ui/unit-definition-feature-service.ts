import { signal, type Signal } from '@angular/core';
import type { AuthSessionPort } from '@tankos/authn';
import { createFeedbackService, type FeedbackService } from '@tankos/feedback';
import type { Logger } from '@tankos/observability';
import { createEntityId } from '@tankos/data-access';
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
  public readonly selectedRecord = signal<UnitDefinitionRecord | undefined>(
    undefined,
  );
  public readonly recordStatus = signal<'idle' | 'pending' | 'ready' | 'error'>(
    'idle',
  );
  public readonly recordError = signal<unknown>(undefined);
  public readonly saveError: Signal<unknown>;
  public readonly saveStatus: Signal<FeatureOperationStatus>;
  public readonly lifecycleError: Signal<unknown>;
  public readonly lifecycleStatus: Signal<FeatureOperationStatus>;
  public readonly label = formatUnitDefinitionLabel;

  readonly #store: UnitDefinitionFeatureStore;
  readonly #managementService: UnitDefinitionManagementService;
  readonly #authSession: AuthSessionPort;
  readonly #feedback: FeedbackService;

  public constructor(
    managementService: UnitDefinitionManagementService,
    authSession: AuthSessionPort,
    logger?: Logger,
    feedback: FeedbackService = createFeedbackService(),
  ) {
    this.#managementService = managementService;
    this.#authSession = authSession;
    this.#feedback = feedback;
    this.#store = createUnitDefinitionFeatureStore(
      managementService,
      authSession,
      logger,
      feedback,
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
    this.selectedRecord.set(undefined);
  }

  public startEdit(record: UnitDefinitionRecord): void {
    this.#store.startEdit(record);
  }

  public cancelEdit(): void {
    this.#store.cancelEdit();
  }

  public loadRecord(id: string): void {
    this.recordStatus.set('pending');
    this.recordError.set(undefined);
    void this.#authSession
      .access()
      .then((access) =>
        this.#managementService.get({
          access,
          id: createEntityId(id),
          ...(access.roles.includes('admin')
            ? { lifecycle: ['active', 'inactive', 'marked-for-deletion'] }
            : {}),
        }),
      )
      .then((record) => {
        this.selectedRecord.set(record);
        this.recordStatus.set(record ? 'ready' : 'error');
        if (record) {
          this.#store.startEdit(record);
        } else {
          this.recordError.set(new Error('Record not found'));
        }
      })
      .catch((error: unknown) => {
        this.selectedRecord.set(undefined);
        this.recordStatus.set('error');
        this.recordError.set(error);
        this.#feedback.error('Unable to load the unit.');
      });
  }

  public save(draft: CustomUnitDefinitionDraft): void {
    this.#store.save(draft);
  }

  public markForDeletion(record: UnitDefinitionRecord): Promise<void> {
    return this.#store.markForDeletion(record);
  }

  public restore(record: UnitDefinitionRecord): Promise<void> {
    return this.#store.restore(record);
  }

  public publish(record: UnitDefinitionRecord): Promise<void> {
    return this.#store.publish(record);
  }

  public delete(record: UnitDefinitionRecord): Promise<void> {
    return this.#store.delete(record);
  }
}
