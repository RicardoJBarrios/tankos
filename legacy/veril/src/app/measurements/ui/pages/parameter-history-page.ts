import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActiveAquariumContext } from '../../../shared/application/active-aquarium-context';
import { AsyncListPageState } from '../../../shared/ui/page-state';
import { PaginationControls } from '../../../shared/ui/pagination-controls/pagination-controls';
import {
  DEFAULT_PAGE_SIZE,
  pageSizeFor,
} from '../../../shared/application/pagination';
import { parameterPresentationFor } from '../../../shared/ui/parameter-presentation';
import { ListParameterHistory } from '../../application/list-parameter-history';
import {
  MeasurementListItem,
  ParameterHistoryCursor,
  ParameterHistoryFilter,
} from '../../application/ports';
import { PARAMETER_IDS, ParameterId } from '../../domain/measurement';
import { KEEPER_SESSION, PARAMETER_HISTORY_READER } from '../providers';

@Component({
  selector: 'veril-parameter-history-page',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    DatePipe,
    PaginationControls,
    RouterLink,
  ],
  templateUrl: './parameter-history-page.html',
  styleUrl: './parameter-history-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: ListParameterHistory,
      useFactory: () =>
        new ListParameterHistory(
          inject(PARAMETER_HISTORY_READER),
          inject(KEEPER_SESSION),
          inject(ActiveAquariumContext),
        ),
    },
  ],
})
export class ParameterHistoryPage implements OnInit {
  private readonly listHistory = inject(ListParameterHistory);
  private readonly activeContext = inject(ActiveAquariumContext);

  readonly parameters = PARAMETER_IDS.map((id) => ({
    id,
    label: parameterPresentationFor(id).label,
  }));
  readonly parameterId = signal<ParameterId>('temperature');
  readonly from = signal('');
  readonly to = signal('');
  readonly state = signal<AsyncListPageState>('loading');
  readonly items = signal<readonly MeasurementListItem[]>([]);
  readonly nextCursor = signal<ParameterHistoryCursor | undefined>(undefined);
  readonly isLoadingMore = signal(false);
  readonly errorMessage = signal('');
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);

  ngOnInit(): void {
    if (!this.activeContext.get()) {
      this.state.set('no-context');
      return;
    }
    void this.loadFirstPage();
  }

  updateParameter(value: string): void {
    if (!PARAMETER_IDS.includes(value as ParameterId)) return;
    this.parameterId.set(value as ParameterId);
    void this.loadFirstPage();
  }

  updateFrom(value: string): void {
    this.from.set(value);
  }

  updateTo(value: string): void {
    this.to.set(value);
  }

  applyFilters(): void {
    void this.loadFirstPage();
  }

  async loadMore(): Promise<void> {
    const cursor = this.nextCursor();
    if (!cursor || this.isLoadingMore()) return;
    this.isLoadingMore.set(true);
    try {
      const page = await this.listHistory.execute(
        this.filter(),
        cursor,
        this.pageSize(),
      );
      this.items.update((items) => [...items, ...page.items]);
      this.nextCursor.set(page.nextCursor);
    } catch {
      this.errorMessage.set('No se ha podido cargar más historial.');
    } finally {
      this.isLoadingMore.set(false);
    }
  }

  changePageSize(value: number): void {
    const next = pageSizeFor({ pageSize: value });
    if (next === this.pageSize()) return;
    this.pageSize.set(next);
    void this.loadFirstPage();
  }

  label(item: MeasurementListItem): string {
    return parameterPresentationFor(item.parameterId).label;
  }

  unit(item: MeasurementListItem): string {
    return parameterPresentationFor(item.parameterId).unit;
  }

  private filter(): ParameterHistoryFilter {
    const from = this.parseDate(this.from());
    const to = this.parseDate(this.to());
    return {
      parameterId: this.parameterId(),
      ...(from ? { from } : {}),
      ...(to ? { to } : {}),
    };
  }

  private parseDate(value: string): Date | undefined {
    if (!value) return undefined;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  private async loadFirstPage(): Promise<void> {
    this.state.set('loading');
    this.errorMessage.set('');
    this.items.set([]);
    this.nextCursor.set(undefined);
    try {
      const page = await this.listHistory.execute(
        this.filter(),
        undefined,
        this.pageSize(),
      );
      this.items.set(page.items);
      this.nextCursor.set(page.nextCursor);
      this.state.set(page.items.length ? 'success' : 'empty');
    } catch (error) {
      this.errorMessage.set(
        error instanceof Error && error.message.includes('interval')
          ? 'El intervalo temporal no es válido.'
          : 'No se ha podido cargar el historial del parámetro.',
      );
      this.state.set('failure');
    }
  }
}
