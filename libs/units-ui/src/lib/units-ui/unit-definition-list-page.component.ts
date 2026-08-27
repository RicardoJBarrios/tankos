import {
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
  type OnInit,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AUTH_SESSION } from '@tankos/authn';
import { CONFIRMATION_SERVICE, confirmAndRun } from '@tankos/feedback';
import type { AccessContext } from '@tankos/data-access';
import { createCrudListQueryState } from '@tankos/data-access-ui';
import { CrudMaterialTableComponent } from '@tankos/data-access-material-ui';
import type { UnitDefinitionRecord } from '@tankos/units';
import {
  unitDefinitionCapabilities,
  type UnitDefinitionCapabilities,
} from '@tankos/units';
import { UnitDefinitionFeatureService } from './unit-definition-feature-service';
import {
  parseUnitDefinitionListQuery,
  unitDefinitionFilterFromQuery,
  unitDefinitionListQueryKey,
  unitDefinitionListQueryParams,
  isUnitDefinitionVisibilityFilter,
  type UnitDefinitionListQuery,
  type UnitDefinitionVisibilityFilter,
} from './unit-definition-list-query';
import {
  cannotNavigateToUnitDefinitionPage,
  noUnitDefinitionCapabilities,
  parseUnitDefinitionPageIndex,
  unitVisibilityLabel,
} from './unit-definition-list-view-helpers';

/** List page owned by the units UI boundary. */
@Component({
  imports: [CrudMaterialTableComponent, RouterLink],
  templateUrl: './unit-definition-list-page.component.html',
  styleUrl: './unit-definition-list-page.component.css',
})
export class UnitDefinitionListPageComponent implements OnInit {
  private static readonly PAGE_SIZE = 10;
  readonly #router = inject(Router);
  readonly #route = inject(ActivatedRoute);
  readonly #destroyRef = inject(DestroyRef);
  readonly #service = inject(UnitDefinitionFeatureService);
  readonly #authSession = inject(AUTH_SESSION);
  readonly #confirmation = inject(CONFIRMATION_SERVICE);
  readonly #access = signal<AccessContext | undefined>(undefined);
  #ready = false;

  protected readonly list = this.#service.list;
  protected readonly lifecycleStatus = this.#service.lifecycleStatus;
  protected readonly label = this.#service.label;
  protected readonly visibilityFilter =
    signal<UnitDefinitionVisibilityFilter>('all');
  protected readonly admin = computed(
    () => this.capabilities()?.canFilterByOwner ?? false,
  );
  protected readonly capabilities = computed<
    UnitDefinitionCapabilities | undefined
  >(() => {
    const access = this.#access();
    return access ? unitDefinitionCapabilities(access) : undefined;
  });
  protected readonly recordFilter = signal('');
  protected readonly ownerFilter = signal('');
  readonly #queryState = createCrudListQueryState<UnitDefinitionListQuery>({
    visibility: 'all',
    record: '',
    owner: '',
  });
  protected readonly pageIndex = this.#queryState.pageIndex;
  protected readonly pageSize = UnitDefinitionListPageComponent.PAGE_SIZE;
  #appliedFilterKey: string | undefined;
  #forceFilterReload = false;
  protected readonly hasFilters = computed(
    () =>
      this.visibilityFilter() !== 'all' ||
      this.recordFilter().trim().length > 0 ||
      (this.admin() && this.ownerFilter().trim().length > 0),
  );
  protected readonly columns = computed(() => [
    {
      id: 'visibility',
      header: 'Visibility',
      value: unitVisibilityLabel,
    },
    ...(this.admin()
      ? [
          {
            id: 'owner',
            header: 'Owner (keeper)',
            value: (record: UnitDefinitionRecord) =>
              record.data.ownerName ?? '—',
          },
        ]
      : []),
  ]);

  public ngOnInit(): void {
    this.#route.queryParamMap
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe((params) => {
        const query = parseUnitDefinitionListQuery(params);
        this.visibilityFilter.set(query.visibility);
        this.recordFilter.set(query.record);
        this.ownerFilter.set(query.owner);
        this.#queryState.hydrate(
          query,
          parseUnitDefinitionPageIndex(params.get('page')),
        );
        if (!this.#ready) return;
        if (
          this.#forceFilterReload ||
          this.#appliedFilterKey !== this.filterKey()
        ) {
          this.#forceFilterReload = false;
          this.loadFilteredList();
        }
      });
    void this.#authSession.access().then((access) => {
      this.#access.set(access);
      this.#ready = true;
      this.loadFilteredList();
    });
  }

  protected readonly canMarkForDeletion = (record: UnitDefinitionRecord) =>
    this.recordCapabilities(record).canDelete;
  protected readonly canEdit = (record: UnitDefinitionRecord) =>
    this.recordCapabilities(record).canEdit;
  protected readonly canPublish = (record: UnitDefinitionRecord) =>
    record.lifecycle.status === 'active' &&
    this.recordCapabilities(record).canPublish;
  protected readonly canPhysicallyDelete = (record: UnitDefinitionRecord) =>
    record.lifecycle.status === 'marked-for-deletion' &&
    this.recordCapabilities(record).canDelete;

  protected filterByVisibility(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    const visibility = isUnitDefinitionVisibilityFilter(value) ? value : 'all';
    this.visibilityFilter.set(visibility);
  }

  protected filterByRecord(event: Event): void {
    this.recordFilter.set((event.target as HTMLInputElement).value);
  }

  protected filterByOwner(event: Event): void {
    this.ownerFilter.set((event.target as HTMLInputElement).value);
  }

  protected applyFilters(): void {
    this.#queryState.setFilter(this.draftQuery());
    this.#forceFilterReload = true;
    void this.#router.navigate([], {
      relativeTo: this.#route,
      queryParams: unitDefinitionListQueryParams(
        this.draftQuery(),
        this.pageIndex(),
        this.admin(),
      ),
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  protected clearFilters(): void {
    this.visibilityFilter.set('all');
    this.recordFilter.set('');
    this.ownerFilter.set('');
    this.applyFilters();
  }

  protected create(): void {
    void this.#router.navigate(['new'], {
      relativeTo: this.#route,
      queryParamsHandling: 'preserve',
    });
  }

  protected edit(record: UnitDefinitionRecord): void {
    void this.#router.navigate([record.id, 'edit'], {
      relativeTo: this.#route,
      queryParamsHandling: 'preserve',
    });
  }

  protected detail(record: UnitDefinitionRecord): void {
    void this.#router.navigate([record.id], {
      relativeTo: this.#route,
      queryParamsHandling: 'preserve',
    });
  }

  protected async markForDeletion(record: UnitDefinitionRecord): Promise<void> {
    await confirmAndRun(
      this.#confirmation,
      {
        title: 'Move unit to recycle bin',
        message: 'The unit will no longer be available in active listings.',
        confirmLabel: 'Move to recycle bin',
      },
      () => this.#service.markForDeletion(record),
    );
  }

  protected restore(record: UnitDefinitionRecord): void {
    void this.#service.restore(record);
  }

  protected async publish(record: UnitDefinitionRecord): Promise<void> {
    await confirmAndRun(
      this.#confirmation,
      {
        title: 'Make unit public',
        message:
          'Public units can be used by all users and cannot be edited by a keeper.',
        confirmLabel: 'Make public',
      },
      () => this.#service.publish(record),
    );
  }

  protected async physicallyDelete(
    record: UnitDefinitionRecord,
  ): Promise<void> {
    await confirmAndRun(
      this.#confirmation,
      {
        title: 'Delete unit permanently',
        message: 'This action cannot be undone.',
        confirmLabel: 'Delete permanently',
      },
      () => this.#service.delete(record),
    );
  }

  protected pageRequested(index: number): void {
    const currentIndex = this.pageIndex();
    if (
      cannotNavigateToUnitDefinitionPage(
        index,
        currentIndex,
        this.list.hasMore(),
        this.list.items().length,
        this.pageSize,
      )
    )
      return;
    const firstItemIndex = index * this.pageSize;
    if (firstItemIndex >= this.list.items().length && this.list.hasMore()) {
      void this.loadNextPageAndNavigate(index);
      return;
    }
    void this.#router.navigate([], {
      relativeTo: this.#route,
      queryParams: { page: index > 0 ? String(index) : null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private async loadNextPageAndNavigate(index: number): Promise<void> {
    await this.list.loadMore();
    void this.#router.navigate([], {
      relativeTo: this.#route,
      queryParams: { page: String(index) },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private loadFilteredList(): void {
    this.#appliedFilterKey = this.filterKey();
    void this.#service.list.load(
      unitDefinitionFilterFromQuery(this.#queryState.filter(), this.admin()),
    );
  }

  private draftQuery(): UnitDefinitionListQuery {
    return {
      visibility: this.visibilityFilter(),
      record: this.recordFilter().trim(),
      owner: this.admin() ? this.ownerFilter().trim() : '',
    };
  }

  private filterKey(): string {
    return unitDefinitionListQueryKey({
      visibility: this.visibilityFilter(),
      record: this.recordFilter(),
      owner: this.admin() ? this.ownerFilter() : '',
    });
  }

  private recordCapabilities(
    record: UnitDefinitionRecord,
  ): UnitDefinitionCapabilities {
    const access = this.#access();
    return access
      ? unitDefinitionCapabilities(access, record.data)
      : noUnitDefinitionCapabilities;
  }
}
