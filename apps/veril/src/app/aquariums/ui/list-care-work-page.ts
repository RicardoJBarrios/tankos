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
import { FirebaseKeeperSession } from '../infrastructure/firebase-keeper-session';
import { FirestoreCareWorkRepository } from '../infrastructure/firestore-care-work-repository';
import { CARE_WORK_READER, KEEPER_SESSION } from './aquarium-providers';

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
    { provide: KEEPER_SESSION, useClass: FirebaseKeeperSession },
  ],
})
export class ListCareWorkPage implements OnInit {
  private readonly listCareWork = inject(ListCareWork);
  private readonly activeContext = inject(ActiveAquariumContext);

  readonly state = signal<PageState>('loading');
  readonly items = signal<readonly CareWorkListItem[]>([]);
  readonly errorMessage = signal('');

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
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(item.performedAt);
  }

  private async loadCareWork(): Promise<void> {
    try {
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
}
