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
import { AquariumTimeZone } from '../domain/aquarium';
import { FirebaseKeeperSession } from '../infrastructure/firebase-keeper-session';
import { FirestoreAquariumRepository } from '../infrastructure/firestore-aquarium-repository';
import { FirestoreObservationRepository } from '../infrastructure/firestore-observation-repository';
import {
  AQUARIUM_REPOSITORY,
  KEEPER_SESSION,
  OBSERVATION_READER,
} from './aquarium-providers';
import { formatAquariumDateTime } from './aquarium-date-time';

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
    { provide: AQUARIUM_REPOSITORY, useClass: FirestoreAquariumRepository },
    { provide: KEEPER_SESSION, useClass: FirebaseKeeperSession },
  ],
})
export class ListObservationsPage implements OnInit {
  private readonly listObservations = inject(ListObservations);
  private readonly activeContext = inject(ActiveAquariumContext);
  private readonly aquariumReader = inject(AQUARIUM_REPOSITORY, {
    optional: true,
  });
  private readonly keeperSession = inject(KEEPER_SESSION, { optional: true });

  readonly state = signal<PageState>('loading');
  readonly items = signal<readonly ObservationListItem[]>([]);
  readonly errorMessage = signal('');
  readonly timeZone = signal<AquariumTimeZone | undefined>(undefined);

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
    return formatAquariumDateTime(item.recordedAt, this.timeZone());
  }

  private async loadObservations(): Promise<void> {
    try {
      await this.loadTimeZone();
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

  private async loadTimeZone(): Promise<void> {
    if (!this.aquariumReader || !this.keeperSession) return;
    const aquariumId = this.activeContext.get();
    if (!aquariumId) return;
    const keeper = await this.keeperSession.requireAuthenticatedKeeper();
    const aquarium = await this.aquariumReader.getOwned(keeper.id, aquariumId);
    if (!aquarium) throw new Error('Aquarium not found');
    this.timeZone.set(aquarium.timeZone);
  }
}
