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
import { ListLivestock } from '../../application/list-livestock';
import { RemoveLivestock } from '../../application/remove-livestock';
import {
  LivestockCursor,
  LivestockListItem,
  SpeciesProfileOption,
} from '../../application/ports';
import {
  KEEPER_SESSION,
  LIVESTOCK_READER,
  LIVESTOCK_SPECIES_PROFILE_CATALOG,
  LIVESTOCK_WRITER,
} from '../providers';
import { AsyncListPageState } from '../../../shared/ui/page-state';
import {
  DEFAULT_PAGE_SIZE,
  pageSizeFor,
} from '../../../shared/application/pagination';
import { PaginationControls } from '../../../shared/ui/pagination-controls/pagination-controls';

type PageState = AsyncListPageState;

@Component({
  selector: 'veril-list-livestock-page',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    PaginationControls,
    RouterLink,
  ],
  templateUrl: './list-livestock-page.html',
  styleUrl: './list-livestock-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: ListLivestock,
      useFactory: () =>
        new ListLivestock(
          inject(LIVESTOCK_READER),
          inject(KEEPER_SESSION),
          inject(ActiveAquariumContext),
        ),
    },
    {
      provide: RemoveLivestock,
      useFactory: () =>
        new RemoveLivestock(
          inject(LIVESTOCK_WRITER),
          inject(KEEPER_SESSION),
          inject(ActiveAquariumContext),
        ),
    },
  ],
})
export class ListLivestockPage implements OnInit {
  private readonly listLivestock = inject(ListLivestock);
  private readonly removeLivestock = inject(RemoveLivestock);
  private readonly speciesProfileCatalog = inject(
    LIVESTOCK_SPECIES_PROFILE_CATALOG,
  );
  private readonly context = inject(ActiveAquariumContext);
  readonly state = signal<PageState>('loading');
  readonly items = signal<readonly LivestockListItem[]>([]);
  readonly speciesProfiles = signal<readonly SpeciesProfileOption[]>([]);
  readonly errorMessage = signal('');
  readonly nextCursor = signal<LivestockCursor | undefined>(undefined);
  readonly isLoadingMore = signal(false);
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);

  ngOnInit(): void {
    if (!this.context.get()) {
      this.state.set('no-context');
      return;
    }
    void this.load();
  }

  retry(): void {
    this.state.set('loading');
    void this.load();
  }

  async loadMore(): Promise<void> {
    const cursor = this.nextCursor();
    if (!cursor || this.isLoadingMore()) return;
    this.isLoadingMore.set(true);
    this.errorMessage.set('');
    try {
      const page = await this.listLivestock.execute(cursor, this.pageSize());
      this.items.update((items) => [...items, ...page.items]);
      this.nextCursor.set(page.nextCursor);
    } catch {
      this.errorMessage.set(
        'No se han podido cargar más registros. Inténtalo de nuevo.',
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
    void this.load();
  }

  async remove(id: string): Promise<void> {
    if (
      !globalThis.confirm(
        '¿Retirar este registro? Se conservará para trazabilidad.',
      )
    )
      return;
    try {
      await this.removeLivestock.execute(id as never);
      await this.load();
    } catch {
      this.errorMessage.set('No se ha podido retirar el registro.');
      this.state.set('failure');
    }
  }

  private async load(): Promise<void> {
    try {
      const [page, speciesProfiles] = await Promise.all([
        this.listLivestock.execute(undefined, this.pageSize()),
        this.speciesProfileCatalog.listPublished(),
      ]);
      this.items.set(page.items);
      this.nextCursor.set(page.nextCursor);
      this.speciesProfiles.set(speciesProfiles);
      this.state.set(page.items.length ? 'success' : 'empty');
    } catch {
      this.errorMessage.set(
        'No se ha podido cargar el livestock. Inténtalo de nuevo.',
      );
      this.state.set('failure');
    }
  }

  speciesProfileNameFor(id: string): string {
    return (
      this.speciesProfiles().find((profile) => profile.id === id)
        ?.displayName ?? 'Especie no disponible'
    );
  }
}
