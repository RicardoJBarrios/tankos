import {
  Component,
  computed,
  inject,
  signal,
  type OnInit,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AUTH_SESSION } from '@tankos/authn';
import { CONFIRMATION_SERVICE, confirmAndRun } from '@tankos/feedback';
import type { AccessContext } from '@tankos/data-access';
import { formatUnitValue } from '@tankos/formatting';
import {
  unitDefinitionCapabilities,
  type UnitDefinitionRecord,
} from '@tankos/units';
import { UnitDefinitionFeatureService } from './unit-definition-feature-service';

/** Read-only detail page for one versioned unit definition. */
@Component({
  imports: [RouterLink],
  templateUrl: './unit-definition-detail-page.component.html',
})
export class UnitDefinitionDetailPageComponent implements OnInit {
  readonly #route = inject(ActivatedRoute);
  readonly #router = inject(Router);
  readonly #service = inject(UnitDefinitionFeatureService);
  readonly #authSession = inject(AUTH_SESSION);
  readonly #confirmation = inject(CONFIRMATION_SERVICE);
  readonly #access = signal<AccessContext | undefined>(undefined);

  protected readonly record = this.#service.selectedRecord;
  protected readonly status = this.#service.recordStatus;
  protected readonly lifecycleStatus = this.#service.lifecycleStatus;
  protected readonly capabilities = computed(() => {
    const access = this.#access();
    const record = this.record();
    return access
      ? unitDefinitionCapabilities(access, record?.data)
      : undefined;
  });
  protected readonly canEdit = computed(
    () => this.capabilities()?.canEdit ?? false,
  );
  protected readonly canDelete = computed(
    () => this.capabilities()?.canDelete ?? false,
  );
  protected readonly canPublish = computed(() => {
    const record = this.record();
    return (
      record?.lifecycle.status === 'active' &&
      (this.capabilities()?.canPublish ?? false)
    );
  });
  protected readonly canRestore = computed(
    () =>
      this.record()?.lifecycle.status === 'marked-for-deletion' &&
      (this.capabilities()?.canRestore ?? false),
  );
  protected readonly canPhysicallyDelete = computed(
    () =>
      this.record()?.lifecycle.status === 'marked-for-deletion' &&
      (this.capabilities()?.canDelete ?? false),
  );
  protected readonly formatValue = formatUnitValue;

  public ngOnInit(): void {
    void this.#authSession.access().then((access) => {
      this.#access.set(access);
    });
    const id = this.#route.snapshot.paramMap.get('id');
    if (id) this.#service.loadRecord(id);
  }

  protected async markForDeletion(): Promise<void> {
    const record = this.record();
    if (!record) return;
    const confirmed = await confirmAndRun(
      this.#confirmation,
      {
        title: 'Move unit to recycle bin',
        message: 'The unit will no longer be available in active listings.',
        confirmLabel: 'Move to recycle bin',
      },
      () => this.#service.markForDeletion(record),
    );
    if (!confirmed) return;
    if (this.lifecycleStatus() === 'idle') await this.backToList();
  }

  protected async restore(): Promise<void> {
    const record = this.record();
    if (record) {
      await this.#service.restore(record);
      this.refresh(record);
    }
  }

  protected async publish(): Promise<void> {
    const record = this.record();
    if (!record) return;
    const confirmed = await confirmAndRun(
      this.#confirmation,
      {
        title: 'Make unit public',
        message:
          'Public units can be used by all users and cannot be edited by a keeper.',
        confirmLabel: 'Make public',
      },
      () => this.#service.publish(record),
    );
    if (confirmed) this.refresh(record);
  }

  protected async physicallyDelete(): Promise<void> {
    const record = this.record();
    if (!record) return;
    const confirmed = await confirmAndRun(
      this.#confirmation,
      {
        title: 'Delete unit permanently',
        message: 'This action cannot be undone.',
        confirmLabel: 'Delete permanently',
      },
      () => this.#service.delete(record),
    );
    if (!confirmed) return;
    if (this.lifecycleStatus() === 'idle') await this.backToList();
  }

  private refresh(record: UnitDefinitionRecord): void {
    if (this.lifecycleStatus() === 'idle') this.#service.loadRecord(record.id);
  }

  private async backToList(): Promise<void> {
    await this.#router.navigate(['/units'], {
      queryParamsHandling: 'preserve',
    });
  }
}
