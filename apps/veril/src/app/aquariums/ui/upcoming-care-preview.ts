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
import { ListPlannedCareWork } from '../application/list-planned-care-work';
import { PlannedCareWorkListItem } from '../application/aquarium-ports';
import { FirebaseKeeperSession } from '../infrastructure/firebase-keeper-session';
import { FirestorePlannedCareWorkRepository } from '../infrastructure/firestore-planned-care-work-repository';
import { KEEPER_SESSION, PLANNED_CARE_WORK_READER } from './aquarium-providers';

const UPCOMING_CARE_PREVIEW_LIMIT = 3;
type PreviewState = 'loading' | 'empty' | 'success' | 'failure' | 'no-context';

@Component({
  selector: 'veril-upcoming-care-preview',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    RouterLink,
  ],
  templateUrl: './upcoming-care-preview.html',
  styleUrl: './upcoming-care-preview.css',
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
  ],
})
export class UpcomingCarePreview implements OnInit {
  private readonly listPlannedCareWork = inject(ListPlannedCareWork);
  private readonly activeContext = inject(ActiveAquariumContext);

  readonly state = signal<PreviewState>('loading');
  readonly items = signal<readonly PlannedCareWorkListItem[]>([]);
  readonly errorMessage = signal('');

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

  formatPlannedFor(item: PlannedCareWorkListItem): string {
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(item.plannedFor);
  }

  private async load(): Promise<void> {
    try {
      const items = await this.listPlannedCareWork.execute(
        UPCOMING_CARE_PREVIEW_LIMIT,
      );
      this.items.set(items);
      this.state.set(items.length === 0 ? 'empty' : 'success');
    } catch {
      this.errorMessage.set(
        'No se han podido cargar los próximos cuidados. Inténtalo de nuevo.',
      );
      this.state.set('failure');
    }
  }
}
