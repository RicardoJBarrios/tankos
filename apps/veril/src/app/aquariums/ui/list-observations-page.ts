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
import { ListObservations } from '../application/list-observations';
import { ObservationListItem } from '../application/aquarium-ports';
import { FirebaseKeeperSession } from '../infrastructure/firebase-keeper-session';
import { FirestoreObservationRepository } from '../infrastructure/firestore-observation-repository';
import { KEEPER_SESSION, OBSERVATION_READER } from './aquarium-providers';

type PageState = 'loading' | 'empty' | 'success' | 'failure' | 'no-context';

@Component({
  selector: 'veril-list-observations-page',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    RouterLink,
  ],
  templateUrl: './list-observations-page.html',
  styleUrl: './list-observations-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: ListObservations,
      useFactory: () =>
        new ListObservations(
          inject(OBSERVATION_READER),
          inject(KEEPER_SESSION),
          inject(ActiveAquariumContext),
        ),
    },
    {
      provide: OBSERVATION_READER,
      useClass: FirestoreObservationRepository,
    },
    { provide: KEEPER_SESSION, useClass: FirebaseKeeperSession },
  ],
})
export class ListObservationsPage implements OnInit {
  private readonly listObservations = inject(ListObservations);
  private readonly activeContext = inject(ActiveAquariumContext);

  readonly state = signal<PageState>('loading');
  readonly items = signal<readonly ObservationListItem[]>([]);
  readonly errorMessage = signal('');

  ngOnInit(): void {
    if (!this.activeContext.get()) {
      this.state.set('no-context');
      return;
    }

    void this.loadObservations();
  }

  retry(): void {
    this.state.set('loading');
    void this.loadObservations();
  }

  formatRecordedAt(item: ObservationListItem): string {
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(item.recordedAt);
  }

  private async loadObservations(): Promise<void> {
    try {
      const items = await this.listObservations.execute();
      this.items.set(items);
      this.state.set(items.length === 0 ? 'empty' : 'success');
    } catch {
      this.errorMessage.set(
        'No se han podido cargar las observaciones. Inténtalo de nuevo.',
      );
      this.state.set('failure');
    }
  }
}
