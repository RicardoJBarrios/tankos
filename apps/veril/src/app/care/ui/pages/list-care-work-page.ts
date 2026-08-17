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
import { CareWorkCursor, CareWorkListItem } from '../../application/ports';
import { ListCareWork } from '../../application/list-care-work';
import { AquariumTimeZone } from '../../../shared/domain/aquarium-reference';
import {
  CARE_AQUARIUM_CONTEXT_READER,
  CARE_WORK_READER,
  KEEPER_SESSION,
} from '../providers';
import { formatAquariumDateTime } from '../../../shared/ui/aquarium-date-time';
import { AsyncListPageState } from '../../../shared/ui/page-state';
import { DEFAULT_PAGE_SIZE, pageSizeFor } from '../../../shared/application/pagination';
import { PaginationControls } from '../../../shared/ui/pagination-controls/pagination-controls';

type PageState = AsyncListPageState;

@Component({
  selector: 'veril-list-care-work-page',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    PaginationControls,
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
  ],
})
export class ListCareWorkPage implements OnInit {
  private readonly listCareWork = inject(ListCareWork);
  private readonly activeContext = inject(ActiveAquariumContext);
  private readonly aquariumContextReader = inject(
    CARE_AQUARIUM_CONTEXT_READER,
    {
      optional: true,
    },
  );
  private readonly keeperSession = inject(KEEPER_SESSION, { optional: true });

  readonly state = signal<PageState>('loading');
  readonly items = signal<readonly CareWorkListItem[]>([]);
  readonly errorMessage = signal('');
  readonly timeZone = signal<AquariumTimeZone | undefined>(undefined);
  readonly nextCursor = signal<CareWorkCursor | undefined>(undefined);
  readonly isLoadingMore = signal(false);
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);

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

  async loadMore(): Promise<void> {
    const cursor = this.nextCursor();
    if (!cursor || this.isLoadingMore()) return;
    this.isLoadingMore.set(true);
    this.errorMessage.set('');
    try {
      const page = await this.listCareWork.execute(cursor, this.pageSize());
      this.items.update((items) => [...items, ...page.items]);
      this.nextCursor.set(page.nextCursor);
    } catch {
      this.errorMessage.set('No se han podido cargar más cuidados. Inténtalo de nuevo.');
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
    void this.loadCareWork();
  }

  formatPerformedAt(item: CareWorkListItem): string {
    return formatAquariumDateTime(item.performedAt, this.timeZone());
  }

  private async loadCareWork(): Promise<void> {
    try {
      await this.loadTimeZone();
      const page = await this.listCareWork.execute(undefined, this.pageSize());
      this.items.set(page.items);
      this.nextCursor.set(page.nextCursor);
      this.state.set(page.items.length === 0 ? 'empty' : 'success');
    } catch {
      this.errorMessage.set(
        'No se han podido cargar los cuidados recientes. Inténtalo de nuevo.',
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
