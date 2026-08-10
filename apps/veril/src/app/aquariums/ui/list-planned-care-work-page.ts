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
import { ActiveAquariumContext } from '../application/active-aquarium-context';
import { CancelPlannedCareWork } from '../application/cancel-planned-care-work';
import { CompletePlannedCareWork } from '../application/complete-planned-care-work';
import { ListPlannedCareWork } from '../application/list-planned-care-work';
import {
  classifyPlannedCareTiming,
  PlannedCareTiming,
} from '../application/planned-care-timing';
import { StopRecurringCarePlan } from '../application/stop-recurring-care-plan';
import { PlannedCareWorkListItem } from '../application/aquarium-ports';
import { FirebaseKeeperSession } from '../infrastructure/firebase-keeper-session';
import { FirestorePlannedCareWorkRepository } from '../infrastructure/firestore-planned-care-work-repository';
import {
  KEEPER_SESSION,
  PLANNED_CARE_WORK_CANCELLER,
  PLANNED_CARE_WORK_COMPLETER,
  PLANNED_CARE_WORK_READER,
  RECURRING_CARE_PLAN_STOPPER,
} from './aquarium-providers';

type PageState = 'loading' | 'empty' | 'success' | 'failure' | 'no-context';

@Component({
  selector: 'veril-list-planned-care-work-page',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    RouterLink,
  ],
  templateUrl: './list-planned-care-work-page.html',
  styleUrl: './list-care-work-page.css',
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
      provide: PLANNED_CARE_WORK_READER,
      useClass: FirestorePlannedCareWorkRepository,
    },
    { provide: KEEPER_SESSION, useClass: FirebaseKeeperSession },
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
      provide: PLANNED_CARE_WORK_COMPLETER,
      useClass: FirestorePlannedCareWorkRepository,
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
      provide: PLANNED_CARE_WORK_CANCELLER,
      useClass: FirestorePlannedCareWorkRepository,
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
    {
      provide: RECURRING_CARE_PLAN_STOPPER,
      useClass: FirestorePlannedCareWorkRepository,
    },
  ],
})
export class ListPlannedCareWorkPage implements OnInit {
  private readonly completePlannedCareWork = inject(CompletePlannedCareWork);
  private readonly cancelPlannedCareWork = inject(CancelPlannedCareWork);
  private readonly stopRecurringCarePlan = inject(StopRecurringCarePlan);
  private readonly listPlannedCareWork = inject(ListPlannedCareWork);
  private readonly activeContext = inject(ActiveAquariumContext);

  readonly state = signal<PageState>('loading');
  readonly items = signal<readonly PlannedCareWorkListItem[]>([]);
  readonly errorMessage = signal('');
  readonly completingId = signal<string | null>(null);
  readonly completionError = signal('');
  readonly cancellingId = signal<string | null>(null);
  readonly cancellationError = signal('');
  readonly stoppingId = signal<string | null>(null);
  readonly stoppingError = signal('');
  readonly now = signal(new Date());

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
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(item.plannedFor);
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
      this.now.set(new Date());
      const items = await this.listPlannedCareWork.execute();
      this.items.set(items);
      this.state.set(items.length === 0 ? 'empty' : 'success');
    } catch {
      this.errorMessage.set(
        'No se han podido cargar los cuidados planificados. Inténtalo de nuevo.',
      );
      this.state.set('failure');
    }
  }
}
