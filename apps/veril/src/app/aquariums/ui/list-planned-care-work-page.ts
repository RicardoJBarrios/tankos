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
import { CompletePlannedCareWork } from '../application/complete-planned-care-work';
import { ListPlannedCareWork } from '../application/list-planned-care-work';
import { PlannedCareWorkListItem } from '../application/aquarium-ports';
import { FirebaseKeeperSession } from '../infrastructure/firebase-keeper-session';
import { FirestorePlannedCareWorkRepository } from '../infrastructure/firestore-planned-care-work-repository';
import {
  KEEPER_SESSION,
  PLANNED_CARE_WORK_COMPLETER,
  PLANNED_CARE_WORK_READER,
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
  ],
})
export class ListPlannedCareWorkPage implements OnInit {
  private readonly completePlannedCareWork = inject(CompletePlannedCareWork);
  private readonly listPlannedCareWork = inject(ListPlannedCareWork);
  private readonly activeContext = inject(ActiveAquariumContext);

  readonly state = signal<PageState>('loading');
  readonly items = signal<readonly PlannedCareWorkListItem[]>([]);
  readonly errorMessage = signal('');
  readonly completingId = signal<string | null>(null);
  readonly completionError = signal('');

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
    if (this.completingId()) return;

    this.completingId.set(item.id);
    this.completionError.set('');
    try {
      await this.completePlannedCareWork.execute(item.id);
      this.items.update((items) => items.filter(({ id }) => id !== item.id));
      this.state.set(this.items().length === 0 ? 'empty' : 'success');
    } catch {
      this.completionError.set(
        'No se ha podido completar el cuidado. Inténtalo de nuevo.',
      );
    } finally {
      this.completingId.set(null);
    }
  }

  formatPlannedFor(item: PlannedCareWorkListItem): string {
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(item.plannedFor);
  }

  private async load(): Promise<void> {
    try {
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
