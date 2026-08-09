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
  CareWorkTimelineItem,
  MeasurementTimelineItem,
  ObservationTimelineItem,
  ReviewRecentTimeline,
  TimelineItem,
} from '../application/review-recent-timeline';
import {
  CARE_WORK_READER,
  KEEPER_SESSION,
  TIMELINE_MEASUREMENT_READER,
  TIMELINE_OBSERVATION_READER,
} from './aquarium-providers';
import { FirebaseKeeperSession } from '../infrastructure/firebase-keeper-session';
import { FirestoreCareWorkRepository } from '../infrastructure/firestore-care-work-repository';
import { FirestoreMeasurementRepository } from '../infrastructure/firestore-measurement-repository';
import { FirestoreObservationRepository } from '../infrastructure/firestore-observation-repository';
import { measurementPresentationFor } from './measurement-presentations';

const RECENT_ACTIVITY_PREVIEW_LIMIT = 3;
type PreviewState = 'loading' | 'empty' | 'success' | 'failure' | 'no-context';

@Component({
  selector: 'veril-recent-activity-preview',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    RouterLink,
  ],
  templateUrl: './recent-activity-preview.html',
  styleUrl: './recent-activity-preview.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: ReviewRecentTimeline,
      useFactory: () =>
        new ReviewRecentTimeline(
          inject(TIMELINE_OBSERVATION_READER),
          inject(TIMELINE_MEASUREMENT_READER),
          inject(CARE_WORK_READER),
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
    { provide: CARE_WORK_READER, useClass: FirestoreCareWorkRepository },
    { provide: KEEPER_SESSION, useClass: FirebaseKeeperSession },
  ],
})
export class RecentActivityPreview implements OnInit {
  private readonly reviewTimeline = inject(ReviewRecentTimeline);
  private readonly activeContext = inject(ActiveAquariumContext);

  readonly state = signal<PreviewState>('loading');
  readonly items = signal<readonly TimelineItem[]>([]);
  readonly errorMessage = signal('');

  ngOnInit(): void {
    if (!this.activeContext.get()) {
      this.state.set('no-context');
      return;
    }

    void this.load();
  }

  retry(): void {
    this.state.set('loading');
    void this.load();
  }

  isObservation(item: TimelineItem): item is ObservationTimelineItem {
    return item.kind === 'observation';
  }

  isMeasurement(item: TimelineItem): item is MeasurementTimelineItem {
    return item.kind === 'measurement';
  }

  isCareWork(item: TimelineItem): item is CareWorkTimelineItem {
    return item.kind === 'care-work';
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

  private async load(): Promise<void> {
    try {
      const items = await this.reviewTimeline.execute(
        RECENT_ACTIVITY_PREVIEW_LIMIT,
      );
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
