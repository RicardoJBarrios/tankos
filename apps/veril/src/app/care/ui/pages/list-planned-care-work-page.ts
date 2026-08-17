import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActiveAquariumContext } from '../../../shared/application/active-aquarium-context';
import { CancelPlannedCareWork } from '../../application/cancel-planned-care-work';
import { CompletePlannedCareWork } from '../../application/complete-planned-care-work';
import { ListPlannedCareWork } from '../../application/list-planned-care-work';
import {
  classifyPlannedCareTiming,
  PlannedCareTiming,
} from '../../application/planned-care-timing';
import { StopRecurringCarePlan } from '../../application/stop-recurring-care-plan';
import {
  PlannedCareWorkCursor,
  PlannedCareWorkListItem,
} from '../../application/ports';
import { AquariumTimeZone } from '../../../shared/domain/aquarium-reference';
import {
  CARE_AQUARIUM_CONTEXT_READER,
  KEEPER_SESSION,
  PLANNED_CARE_WORK_CANCELLER,
  PLANNED_CARE_WORK_COMPLETER,
  PLANNED_CARE_WORK_READER,
  RECURRING_CARE_PLAN_STOPPER,
} from '../providers';
import { formatAquariumDateTime } from '../../../shared/ui/aquarium-date-time';
import { AsyncListPageState } from '../../../shared/ui/page-state';
import { systemClock } from '../../../shared/application/clock';
import {
  DEFAULT_PAGE_SIZE,
  pageSizeFor,
} from '../../../shared/application/pagination';
import { PaginationControls } from '../../../shared/ui/pagination-controls/pagination-controls';

type PageState = AsyncListPageState;

@Component({
  selector: 'veril-list-planned-care-work-page',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    PaginationControls,
    RouterLink,
  ],
  templateUrl: './list-planned-care-work-page.html',
  styleUrl: './list-planned-care-work-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: ListPlannedCareWork,
      useFactory: () =>
        new ListPlannedCareWork(
          inject(PLANNED_CARE_WORK_READER),
          inject(KEEPER_SESSION),
          inject(ActiveAquariumContext),
        ),
    },
    {
      provide: CompletePlannedCareWork,
      useFactory: () =>
        new CompletePlannedCareWork(
          inject(PLANNED_CARE_WORK_COMPLETER),
          inject(KEEPER_SESSION),
          inject(ActiveAquariumContext),
        ),
    },
    {
      provide: CancelPlannedCareWork,
      useFactory: () =>
        new CancelPlannedCareWork(
          inject(PLANNED_CARE_WORK_CANCELLER),
          inject(KEEPER_SESSION),
          inject(ActiveAquariumContext),
        ),
    },
    {
      provide: StopRecurringCarePlan,
      useFactory: () =>
        new StopRecurringCarePlan(
          inject(RECURRING_CARE_PLAN_STOPPER),
          inject(KEEPER_SESSION),
          inject(ActiveAquariumContext),
        ),
    },
  ],
})
export class ListPlannedCareWorkPage implements OnInit {
  private readonly completePlannedCareWork = inject(CompletePlannedCareWork);
  private readonly cancelPlannedCareWork = inject(CancelPlannedCareWork);
  private readonly stopRecurringCarePlan = inject(StopRecurringCarePlan);
  private readonly listPlannedCareWork = inject(ListPlannedCareWork);
  private readonly activeContext = inject(ActiveAquariumContext);
  private readonly aquariumContextReader = inject(
    CARE_AQUARIUM_CONTEXT_READER,
    {
      optional: true,
    },
  );
  private readonly keeperSession = inject(KEEPER_SESSION, { optional: true });

  readonly state = signal<PageState>('loading');
  readonly items = signal<readonly PlannedCareWorkListItem[]>([]);
  readonly errorMessage = signal('');
  readonly completingId = signal<string | null>(null);
  readonly completionError = signal('');
  readonly cancellingId = signal<string | null>(null);
  readonly cancellationError = signal('');
  readonly stoppingId = signal<string | null>(null);
  readonly stoppingError = signal('');
  readonly now = signal(systemClock.now());
  readonly timeZone = signal<AquariumTimeZone | undefined>(undefined);
  readonly nextCursor = signal<PlannedCareWorkCursor | undefined>(undefined);
  readonly isLoadingMore = signal(false);
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);

  ngOnInit(): void {
    if (!this.activeContext.get()) {
      this.state.set('no-context');
      return;
    }

    void this.load();
  }

  retry(): void {
    this.state.set('loading');
    void this.load();
  }

  async loadMore(): Promise<void> {
    const cursor = this.nextCursor();
    if (!cursor || this.isLoadingMore()) return;
    this.isLoadingMore.set(true);
    this.errorMessage.set('');
    try {
      const page = await this.listPlannedCareWork.execute(
        cursor,
        this.pageSize(),
      );
      this.items.update((items) => [...items, ...page.items]);
      this.nextCursor.set(page.nextCursor);
    } catch {
      this.errorMessage.set(
        'No se han podido cargar más cuidados planificados. Inténtalo de nuevo.',
      );
    } finally {
      this.isLoadingMore.set(false);
    }
  }

  changePageSize(value: number): void {
    const nextPageSize = pageSizeFor({ pageSize: value });
    if (nextPageSize === this.pageSize()) return;
    this.pageSize.set(nextPageSize);
    this.items.set([]);
    this.nextCursor.set(undefined);
    this.state.set('loading');
    void this.load();
  }

  async complete(item: PlannedCareWorkListItem): Promise<void> {
    if (this.completingId() || this.cancellingId() || this.stoppingId()) return;

    this.completingId.set(item.id);
    this.completionError.set('');
    try {
      await this.completePlannedCareWork.execute(item.id);
      if (item.provenance === 'recurring-plan') {
        await this.load();
      } else {
        this.items.update((items) => items.filter(({ id }) => id !== item.id));
        this.state.set(this.items().length === 0 ? 'empty' : 'success');
      }
    } catch {
      this.completionError.set(
        'No se ha podido completar el cuidado. Inténtalo de nuevo.',
      );
    } finally {
      this.completingId.set(null);
    }
  }

  async cancel(item: PlannedCareWorkListItem): Promise<void> {
    if (this.completingId() || this.cancellingId() || this.stoppingId()) return;
    if (!window.confirm(`¿Cancelar "${item.description}"?`)) return;

    this.cancellingId.set(item.id);
    this.cancellationError.set('');
    try {
      await this.cancelPlannedCareWork.execute(item.id);
      if (item.provenance === 'recurring-plan') {
        await this.load();
      } else {
        this.items.update((items) => items.filter(({ id }) => id !== item.id));
        this.state.set(this.items().length === 0 ? 'empty' : 'success');
      }
    } catch {
      this.cancellationError.set(
        'No se ha podido cancelar el cuidado. Inténtalo de nuevo.',
      );
    } finally {
      this.cancellingId.set(null);
    }
  }

  async stop(item: PlannedCareWorkListItem): Promise<void> {
    if (
      !item.recurringCarePlanId ||
      this.completingId() ||
      this.cancellingId() ||
      this.stoppingId()
    )
      return;
    if (!window.confirm(`¿Detener "${item.description}"?`)) return;
    this.stoppingId.set(item.id);
    this.stoppingError.set('');
    try {
      await this.stopRecurringCarePlan.execute(item.recurringCarePlanId);
      this.items.update((items) => items.filter(({ id }) => id !== item.id));
      this.state.set(this.items().length === 0 ? 'empty' : 'success');
    } catch {
      this.stoppingError.set(
        'No se ha podido detener la recurrencia. Inténtalo de nuevo.',
      );
    } finally {
      this.stoppingId.set(null);
    }
  }

  formatPlannedFor(item: PlannedCareWorkListItem): string {
    return formatAquariumDateTime(item.plannedFor, this.timeZone());
  }

  timing(item: PlannedCareWorkListItem): PlannedCareTiming {
    return classifyPlannedCareTiming(item.plannedFor, this.now());
  }

  timingLabel(item: PlannedCareWorkListItem): string {
    if (item.plannedFor.getTime() === this.now().getTime()) return 'Ahora';
    return this.timing(item) === 'overdue' ? 'Vencido' : 'Pendiente';
  }

  private async load(): Promise<void> {
    try {
      this.now.set(systemClock.now());
      await this.loadTimeZone();
      const page = await this.listPlannedCareWork.execute(
        undefined,
        this.pageSize(),
      );
      this.items.set(page.items);
      this.nextCursor.set(page.nextCursor);
      this.state.set(page.items.length === 0 ? 'empty' : 'success');
    } catch {
      this.errorMessage.set(
        'No se han podido cargar los cuidados planificados. Inténtalo de nuevo.',
      );
      this.state.set('failure');
    }
  }

  private async loadTimeZone(): Promise<void> {
    if (!this.aquariumContextReader || !this.keeperSession) return;
    const aquariumId = this.activeContext.get();
    if (!aquariumId) return;
    const keeper = await this.keeperSession.requireAuthenticatedKeeper();
    const aquarium = await this.aquariumContextReader.getOwned(
      keeper.id,
      aquariumId,
    );
    if (!aquarium) throw new Error('Aquarium not found');
    this.timeZone.set(aquarium.timeZone);
  }
}
