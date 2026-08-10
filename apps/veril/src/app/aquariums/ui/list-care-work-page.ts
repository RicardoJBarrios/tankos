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
import { CareWorkListItem } from '../application/aquarium-ports';
import { ListCareWork } from '../application/list-care-work';
import { AquariumTimeZone } from '../domain/aquarium';
import { FirebaseKeeperSession } from '../infrastructure/firebase-keeper-session';
import { FirestoreAquariumRepository } from '../infrastructure/firestore-aquarium-repository';
import { FirestoreCareWorkRepository } from '../infrastructure/firestore-care-work-repository';
import {
  AQUARIUM_REPOSITORY,
  CARE_WORK_READER,
  KEEPER_SESSION,
} from './aquarium-providers';
import { formatAquariumDateTime } from './aquarium-date-time';

type PageState = 'loading' | 'empty' | 'success' | 'failure' | 'no-context';

@Component({
  selector: 'veril-list-care-work-page',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    RouterLink,
  ],
  templateUrl: './list-care-work-page.html',
  styleUrl: './list-care-work-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: ListCareWork,
      useFactory: () =>
        new ListCareWork(
          inject(CARE_WORK_READER),
          inject(KEEPER_SESSION),
          inject(ActiveAquariumContext),
        ),
    },
    { provide: CARE_WORK_READER, useClass: FirestoreCareWorkRepository },
    { provide: AQUARIUM_REPOSITORY, useClass: FirestoreAquariumRepository },
    { provide: KEEPER_SESSION, useClass: FirebaseKeeperSession },
  ],
})
export class ListCareWorkPage implements OnInit {
  private readonly listCareWork = inject(ListCareWork);
  private readonly activeContext = inject(ActiveAquariumContext);
  private readonly aquariumReader = inject(AQUARIUM_REPOSITORY, {
    optional: true,
  });
  private readonly keeperSession = inject(KEEPER_SESSION, { optional: true });

  readonly state = signal<PageState>('loading');
  readonly items = signal<readonly CareWorkListItem[]>([]);
  readonly errorMessage = signal('');
  readonly timeZone = signal<AquariumTimeZone | undefined>(undefined);

  ngOnInit(): void {
    if (!this.activeContext.get()) {
      this.state.set('no-context');
      return;
    }

    void this.loadCareWork();
  }

  retry(): void {
    this.state.set('loading');
    void this.loadCareWork();
  }

  formatPerformedAt(item: CareWorkListItem): string {
    return formatAquariumDateTime(item.performedAt, this.timeZone());
  }

  private async loadCareWork(): Promise<void> {
    try {
      await this.loadTimeZone();
      const items = await this.listCareWork.execute();
      this.items.set(items);
      this.state.set(items.length === 0 ? 'empty' : 'success');
    } catch {
      this.errorMessage.set(
        'No se han podido cargar los cuidados recientes. Inténtalo de nuevo.',
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
