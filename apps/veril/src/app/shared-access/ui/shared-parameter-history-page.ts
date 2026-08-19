import { DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import {
  DEFAULT_PAGE_SIZE,
  pageSizeFor,
} from '../../shared/application/pagination';
import { PaginationControls } from '../../shared/ui/pagination-controls/pagination-controls';
import { parameterPresentationFor } from '../../shared/ui/parameter-presentation';
import {
  SharedMeasurementHistoryCursor,
  SharedMeasurementHistoryFilter,
  SharedMeasurementHistoryItem,
} from '../application/measurement-history-ports';
import { SHARED_MEASUREMENT_HISTORY_READER } from './providers';
const SHARED_PARAMETER_IDS = [
  'temperature',
  'salinity',
  'alkalinity',
  'nitrate',
  'phosphate',
] as const;
type SharedParameterId = (typeof SHARED_PARAMETER_IDS)[number];

@Component({
  selector: 'veril-shared-parameter-history-page',
  imports: [
    DatePipe,
    MatButtonModule,
    MatCardModule,
    PaginationControls,
    RouterLink,
  ],
  templateUrl: './shared-parameter-history-page.html',
  styleUrl: './shared-parameter-history-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SharedParameterHistoryPage {
  readonly route = inject(ActivatedRoute);
  private readonly reader = inject(SHARED_MEASUREMENT_HISTORY_READER);
  private readonly aquariumId: string;

  readonly parameters = SHARED_PARAMETER_IDS.map((id) => ({
    id,
    label: parameterPresentationFor(id).label,
  }));
  readonly parameterId = signal<SharedParameterId>('temperature');
  readonly items = signal<readonly SharedMeasurementHistoryItem[]>([]);
  readonly nextCursor = signal<SharedMeasurementHistoryCursor | undefined>(
    undefined,
  );
  readonly isLoading = signal(true);
  readonly isLoadingMore = signal(false);
  readonly error = signal(false);
  readonly pageSize = signal(DEFAULT_PAGE_SIZE);

  constructor() {
    const aquariumId = this.route.snapshot.paramMap.get('aquariumId');
    if (!aquariumId) throw new Error('Aquarium id is required');
    this.aquariumId = aquariumId;
    void this.loadFirstPage();
  }

  updateParameter(value: string): void {
    if (!SHARED_PARAMETER_IDS.includes(value as SharedParameterId)) return;
    this.parameterId.set(value as SharedParameterId);
    void this.loadFirstPage();
  }

  async loadMore(): Promise<void> {
    const cursor = this.nextCursor();
    if (!cursor || this.isLoadingMore()) return;
    this.isLoadingMore.set(true);
    try {
      const page = await this.reader.list(
        this.aquariumId,
        this.filter(),
        cursor,
        this.pageSize(),
      );
      this.items.update((items) => [...items, ...page.items]);
      this.nextCursor.set(page.nextCursor);
    } catch {
      this.error.set(true);
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

  label(item: SharedMeasurementHistoryItem): string {
    return parameterPresentationFor(item.parameterId).label;
  }
  unit(item: SharedMeasurementHistoryItem): string {
    return parameterPresentationFor(item.parameterId).unit;
  }

  private filter(): SharedMeasurementHistoryFilter {
    return { parameterId: this.parameterId() };
  }

  private async loadFirstPage(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(false);
    this.items.set([]);
    this.nextCursor.set(undefined);
    try {
      const page = await this.reader.list(
        this.aquariumId,
        this.filter(),
        undefined,
        this.pageSize(),
      );
      this.items.set(page.items);
      this.nextCursor.set(page.nextCursor);
    } catch {
      this.error.set(true);
    } finally {
      this.isLoading.set(false);
    }
  }
}
