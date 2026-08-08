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
import {
  MeasurementTimelineItem,
  ObservationTimelineItem,
  ReviewRecentTimeline,
  TimelineItem,
} from '../application/review-recent-timeline';
import {
  KEEPER_SESSION,
  TIMELINE_MEASUREMENT_READER,
  TIMELINE_OBSERVATION_READER,
} from './aquarium-providers';
import { FirebaseKeeperSession } from '../infrastructure/firebase-keeper-session';
import { FirestoreMeasurementRepository } from '../infrastructure/firestore-measurement-repository';
import { FirestoreObservationRepository } from '../infrastructure/firestore-observation-repository';
import { measurementPresentationFor } from './measurement-presentations';

type PageState = 'loading' | 'empty' | 'success' | 'failure' | 'no-context';

@Component({
  selector: 'veril-review-recent-timeline-page',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    RouterLink,
  ],
  templateUrl: './review-recent-timeline-page.html',
  styleUrl: './review-recent-timeline-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: ReviewRecentTimeline,
      useFactory: () =>
        new ReviewRecentTimeline(
          inject(TIMELINE_OBSERVATION_READER),
          inject(TIMELINE_MEASUREMENT_READER),
          inject(KEEPER_SESSION),
          inject(ActiveAquariumContext),
        ),
    },
    {
      provide: TIMELINE_OBSERVATION_READER,
      useClass: FirestoreObservationRepository,
    },
    {
      provide: TIMELINE_MEASUREMENT_READER,
      useClass: FirestoreMeasurementRepository,
    },
    { provide: KEEPER_SESSION, useClass: FirebaseKeeperSession },
  ],
})
export class ReviewRecentTimelinePage implements OnInit {
  private readonly reviewTimeline = inject(ReviewRecentTimeline);
  private readonly activeContext = inject(ActiveAquariumContext);

  readonly state = signal<PageState>('loading');
  readonly items = signal<readonly TimelineItem[]>([]);
  readonly errorMessage = signal('');

  ngOnInit(): void {
    if (!this.activeContext.get()) {
      this.state.set('no-context');
      return;
    }

    void this.loadTimeline();
  }

  retry(): void {
    this.state.set('loading');
    void this.loadTimeline();
  }

  isObservation(item: TimelineItem): item is ObservationTimelineItem {
    return item.kind === 'observation';
  }

  isMeasurement(item: TimelineItem): item is MeasurementTimelineItem {
    return item.kind === 'measurement';
  }

  measurementLabel(item: MeasurementTimelineItem): string {
    return measurementPresentationFor(item.parameterId).label;
  }

  measurementUnit(item: MeasurementTimelineItem): string {
    return measurementPresentationFor(item.parameterId).unit;
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(date);
  }

  private async loadTimeline(): Promise<void> {
    try {
      const items = await this.reviewTimeline.execute();
      this.items.set(items);
      this.state.set(items.length === 0 ? 'empty' : 'success');
    } catch {
      this.errorMessage.set(
        'No se ha podido cargar la actividad reciente. Inténtalo de nuevo.',
      );
      this.state.set('failure');
    }
  }
}
