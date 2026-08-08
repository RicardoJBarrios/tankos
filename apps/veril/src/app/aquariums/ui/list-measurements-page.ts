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
import { ListMeasurements } from '../application/list-measurements';
import {
  MeasurementCursor,
  MeasurementListItem,
} from '../application/aquarium-ports';
import { FirebaseKeeperSession } from '../infrastructure/firebase-keeper-session';
import { FirestoreMeasurementRepository } from '../infrastructure/firestore-measurement-repository';
import { KEEPER_SESSION, MEASUREMENT_READER } from './aquarium-providers';
import { measurementPresentationFor } from './measurement-presentations';

type PageState = 'loading' | 'empty' | 'success' | 'failure' | 'no-context';

@Component({
  selector: 'veril-list-measurements-page',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    RouterLink,
  ],
  templateUrl: './list-measurements-page.html',
  styleUrl: './list-measurements-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: ListMeasurements,
      useFactory: () =>
        new ListMeasurements(
          inject(MEASUREMENT_READER),
          inject(KEEPER_SESSION),
          inject(ActiveAquariumContext),
        ),
    },
    {
      provide: MEASUREMENT_READER,
      useClass: FirestoreMeasurementRepository,
    },
    { provide: KEEPER_SESSION, useClass: FirebaseKeeperSession },
  ],
})
export class ListMeasurementsPage implements OnInit {
  private readonly listMeasurements = inject(ListMeasurements);
  private readonly activeContext = inject(ActiveAquariumContext);

  readonly state = signal<PageState>('loading');
  readonly items = signal<readonly MeasurementListItem[]>([]);
  readonly nextCursor = signal<MeasurementCursor | undefined>(undefined);
  readonly isLoadingMore = signal(false);
  readonly errorMessage = signal('');

  ngOnInit(): void {
    if (!this.activeContext.get()) {
      this.state.set('no-context');
      return;
    }

    void this.loadFirstPage();
  }

  async loadMore(): Promise<void> {
    const cursor = this.nextCursor();
    if (!cursor || this.isLoadingMore()) {
      return;
    }

    this.isLoadingMore.set(true);
    this.errorMessage.set('');

    try {
      const page = await this.listMeasurements.execute(cursor);
      this.items.update((items) => [...items, ...page.items]);
      this.nextCursor.set(page.nextCursor);
    } catch {
      this.errorMessage.set(
        'No se han podido cargar más mediciones. Inténtalo de nuevo.',
      );
    } finally {
      this.isLoadingMore.set(false);
    }
  }

  retry(): void {
    this.state.set('loading');
    void this.loadFirstPage();
  }

  measurementLabel(item: MeasurementListItem): string {
    return measurementPresentationFor(item.parameterId).label;
  }

  measurementUnit(item: MeasurementListItem): string {
    return measurementPresentationFor(item.parameterId).unit;
  }

  formatMeasuredAt(item: MeasurementListItem): string {
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(item.measuredAt);
  }

  private async loadFirstPage(): Promise<void> {
    try {
      const page = await this.listMeasurements.execute();
      this.items.set(page.items);
      this.nextCursor.set(page.nextCursor);
      this.state.set(page.items.length === 0 ? 'empty' : 'success');
    } catch {
      this.errorMessage.set(
        'No se han podido cargar las mediciones. Inténtalo de nuevo.',
      );
      this.state.set('failure');
    }
  }
}
