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
import { ListObservations } from '../../application/list-observations';
import {
  ObservationCursor,
  ObservationListItem,
} from '../../application/ports';
import { AquariumTimeZone } from '../../../shared/domain/aquarium-reference';
import {
  OBSERVATION_AQUARIUM_CONTEXT_READER,
  KEEPER_SESSION,
  OBSERVATION_READER,
} from '../providers';
import { formatAquariumDateTime } from '../../../shared/ui/aquarium-date-time';
import { AsyncListPageState } from '../../../shared/ui/page-state';
import {
  DEFAULT_PAGE_SIZE,
  pageSizeFor,
} from '../../../shared/application/pagination';
import { PaginationControls } from '../../../shared/ui/pagination-controls/pagination-controls';

type PageState = AsyncListPageState;

@Component({
  selector: 'veril-list-observations-page',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    PaginationControls,
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
  ],
})
export class ListObservationsPage implements OnInit {
  private readonly listObservations = inject(ListObservations);
  private readonly activeContext = inject(ActiveAquariumContext);
  private readonly aquariumContextReader = inject(
    OBSERVATION_AQUARIUM_CONTEXT_READER,
    {
      optional: true,
    },
  );
  private readonly keeperSession = inject(KEEPER_SESSION, { optional: true });

  readonly state = signal<PageState>('loading');
  readonly items = signal<readonly ObservationListItem[]>([]);
  readonly errorMessage = signal('');
  readonly timeZone = signal<AquariumTimeZone | undefined>(undefined);
  readonly nextCursor = signal<ObservationCursor | undefined>(undefined);
  readonly isLoadingMore = signal(false);
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);

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

  async loadMore(): Promise<void> {
    const cursor = this.nextCursor();
    if (!cursor || this.isLoadingMore()) return;
    this.isLoadingMore.set(true);
    this.errorMessage.set('');
    try {
      const page = await this.listObservations.execute(cursor, this.pageSize());
      this.items.update((items) => [...items, ...page.items]);
      this.nextCursor.set(page.nextCursor);
    } catch {
      this.errorMessage.set(
        'No se han podido cargar más observaciones. Inténtalo de nuevo.',
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
    void this.loadObservations();
  }

  formatRecordedAt(item: ObservationListItem): string {
    return formatAquariumDateTime(item.recordedAt, this.timeZone());
  }

  private async loadObservations(): Promise<void> {
    try {
      await this.loadTimeZone();
      const page = await this.listObservations.execute(
        undefined,
        this.pageSize(),
      );
      this.items.set(page.items);
      this.nextCursor.set(page.nextCursor);
      this.state.set(page.items.length === 0 ? 'empty' : 'success');
    } catch {
      this.errorMessage.set(
        'No se han podido cargar las observaciones. Inténtalo de nuevo.',
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
