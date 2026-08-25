import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AquariumCursor, AquariumListItem } from '../../application/ports';
import { ActiveAquariumContext } from '../../../shared/application/active-aquarium-context';
import { ListMyAquariums } from '../../application/list-my-aquariums';
import { SelectAquarium } from '../../application/select-aquarium';
import { AQUARIUM_REPOSITORY, KEEPER_SESSION } from '../providers';
import {
  DEFAULT_PAGE_SIZE,
  pageSizeFor,
} from '../../../shared/application/pagination';
import { PaginationControls } from '../../../shared/ui/pagination-controls/pagination-controls';

type ListState = 'loading' | 'empty' | 'success' | 'failure';

@Component({
  selector: 'veril-list-my-aquariums-page',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    PaginationControls,
    RouterLink,
  ],
  templateUrl: './list-my-aquariums-page.html',
  styleUrl: './list-my-aquariums-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: ListMyAquariums,
      useFactory: () =>
        new ListMyAquariums(
          inject(AQUARIUM_REPOSITORY),
          inject(KEEPER_SESSION),
        ),
    },
    {
      provide: SelectAquarium,
      useFactory: () =>
        new SelectAquarium(
          inject(AQUARIUM_REPOSITORY),
          inject(KEEPER_SESSION),
          inject(ActiveAquariumContext),
        ),
    },
  ],
})
export class ListMyAquariumsPage implements OnInit {
  private readonly listMyAquariums = inject(ListMyAquariums);
  private readonly selectAquarium = inject(SelectAquarium);
  private readonly router = inject(Router);
  readonly activeContext = inject(ActiveAquariumContext);

  readonly state = signal<ListState>('loading');
  readonly aquariums = signal<readonly AquariumListItem[]>([]);
  readonly selectionState = signal<'idle' | 'loading' | 'failure'>('idle');
  readonly nextCursor = signal<AquariumCursor | undefined>(undefined);
  readonly isLoadingMore = signal(false);
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);

  ngOnInit(): void {
    void this.loadAquariums();
  }

  async select(aquarium: AquariumListItem): Promise<void> {
    if (this.activeContext.get() === aquarium.id) {
      await this.router.navigateByUrl('/app/aquariums/current');
      return;
    }

    this.selectionState.set('loading');

    try {
      await this.selectAquarium.execute(aquarium.id);
      this.selectionState.set('idle');
      await this.router.navigateByUrl('/app/aquariums/current');
    } catch {
      this.selectionState.set('failure');
    }
  }

  retry(): void {
    this.state.set('loading');
    void this.loadAquariums();
  }

  async loadMore(): Promise<void> {
    const cursor = this.nextCursor();
    if (!cursor || this.isLoadingMore()) return;
    this.isLoadingMore.set(true);
    try {
      const page = await this.listMyAquariums.execute(cursor, this.pageSize());
      this.aquariums.update((items) => [...items, ...page.items]);
      this.nextCursor.set(page.nextCursor);
    } finally {
      this.isLoadingMore.set(false);
    }
  }

  changePageSize(value: number): void {
    const nextPageSize = pageSizeFor({ pageSize: value });
    if (nextPageSize === this.pageSize()) return;
    this.pageSize.set(nextPageSize);
    this.aquariums.set([]);
    this.nextCursor.set(undefined);
    this.state.set('loading');
    void this.loadAquariums();
  }

  private async loadAquariums(): Promise<void> {
    try {
      const page = await this.listMyAquariums.execute(
        undefined,
        this.pageSize(),
      );
      this.aquariums.set(page.items);
      this.nextCursor.set(page.nextCursor);
      this.state.set(page.items.length === 0 ? 'empty' : 'success');
    } catch {
      this.state.set('failure');
    }
  }
}
