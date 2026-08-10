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
  CareWorkTimelineItem,
  ReviewRecentTimeline,
  TimelineItem,
} from '../application/review-recent-timeline';
import { AquariumTimeZone } from '../domain/aquarium';
import {
  AQUARIUM_REPOSITORY,
  KEEPER_SESSION,
  TIMELINE_MEASUREMENT_READER,
  TIMELINE_OBSERVATION_READER,
  CARE_WORK_READER,
} from './aquarium-providers';
import { FirebaseKeeperSession } from '../infrastructure/firebase-keeper-session';
import { FirestoreMeasurementRepository } from '../infrastructure/firestore-measurement-repository';
import { FirestoreObservationRepository } from '../infrastructure/firestore-observation-repository';
import { FirestoreCareWorkRepository } from '../infrastructure/firestore-care-work-repository';
import { FirestoreAquariumRepository } from '../infrastructure/firestore-aquarium-repository';
import { measurementPresentationFor } from './measurement-presentations';
import { formatAquariumDateTime } from './aquarium-date-time';

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
    { provide: AQUARIUM_REPOSITORY, useClass: FirestoreAquariumRepository },
    { provide: KEEPER_SESSION, useClass: FirebaseKeeperSession },
  ],
})
export class ReviewRecentTimelinePage implements OnInit {
  private readonly reviewTimeline = inject(ReviewRecentTimeline);
  private readonly activeContext = inject(ActiveAquariumContext);
  private readonly aquariumReader = inject(AQUARIUM_REPOSITORY, {
    optional: true,
  });
  private readonly keeperSession = inject(KEEPER_SESSION, { optional: true });

  readonly state = signal<PageState>('loading');
  readonly items = signal<readonly TimelineItem[]>([]);
  readonly errorMessage = signal('');
  readonly timeZone = signal<AquariumTimeZone | undefined>(undefined);

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
    return formatAquariumDateTime(date, this.timeZone());
  }

  private async loadTimeline(): Promise<void> {
    try {
      await this.loadTimeZone();
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

  private async loadTimeZone(): Promise<void> {
    if (!this.aquariumReader || !this.keeperSession) return;
    const aquariumId = this.activeContext.get();
    if (!aquariumId) return;
    const keeper = await this.keeperSession.requireAuthenticatedKeeper();
    const aquarium = await this.aquariumReader.getOwned(keeper.id, aquariumId);
    if (!aquarium) throw new Error('Aquarium not found');
    this.timeZone.set(aquarium.timeZone);
  }
}
