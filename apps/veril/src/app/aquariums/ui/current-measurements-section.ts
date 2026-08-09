import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActiveAquariumContext } from '../application/active-aquarium-context';
import { CurrentMeasurementValue } from '../application/aquarium-ports';
import { ReviewCurrentMeasurements } from '../application/review-current-measurements';
import { FirebaseKeeperSession } from '../infrastructure/firebase-keeper-session';
import { FirestoreMeasurementRepository } from '../infrastructure/firestore-measurement-repository';
import {
  CURRENT_MEASUREMENT_READER,
  KEEPER_SESSION,
} from './aquarium-providers';
import { measurementPresentationFor } from './measurement-presentations';

type SectionState = 'loading' | 'ready' | 'failure';

@Component({
  selector: 'veril-current-measurements-section',
  imports: [MatCardModule, MatProgressSpinnerModule],
  templateUrl: './current-measurements-section.html',
  styleUrl: './current-measurements-section.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: ReviewCurrentMeasurements,
      useFactory: () =>
        new ReviewCurrentMeasurements(
          inject(CURRENT_MEASUREMENT_READER),
          inject(KEEPER_SESSION),
          inject(ActiveAquariumContext),
        ),
    },
    {
      provide: CURRENT_MEASUREMENT_READER,
      useClass: FirestoreMeasurementRepository,
    },
    { provide: KEEPER_SESSION, useClass: FirebaseKeeperSession },
  ],
})
export class CurrentMeasurementsSection implements OnInit {
  private readonly reviewCurrentMeasurements = inject(
    ReviewCurrentMeasurements,
  );

  readonly state = signal<SectionState>('loading');
  readonly values = signal<readonly CurrentMeasurementValue[]>([]);

  ngOnInit(): void {
    this.load();
  }

  label(item: CurrentMeasurementValue): string {
    return measurementPresentationFor(item.parameterId).label;
  }

  unit(item: CurrentMeasurementValue): string {
    return measurementPresentationFor(item.parameterId).unit;
  }

  formatMeasuredAt(item: CurrentMeasurementValue): string {
    return item.measuredAt
      ? new Intl.DateTimeFormat('es-ES', {
          dateStyle: 'short',
          timeStyle: 'short',
        }).format(item.measuredAt)
      : '';
  }

  retry(): void {
    this.state.set('loading');
    this.load();
  }

  private load(): void {
    this.reviewCurrentMeasurements.execute().then(
      (values) => {
        this.values.set(values);
        this.state.set('ready');
      },
      () => this.state.set('failure'),
    );
  }
}
