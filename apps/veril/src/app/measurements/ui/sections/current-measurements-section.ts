import {
  ChangeDetectionStrategy,
  Component,
  Input,
  output,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CurrentParameterState } from '../../application/parameter-status';
import { AquariumTimeZone } from '../../../shared/domain/aquarium-reference';
import { RouterLink } from '@angular/router';
import { parameterPresentationFor } from '../../../shared/ui/parameter-presentation';
import { formatAquariumDateTime } from '../../../shared/ui/aquarium-date-time';
import { measurementAgeFor } from '../utils/measurement-age';
import { systemClock } from '../../../shared/application/clock';

@Component({
  selector: 'veril-current-measurements-section',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatProgressSpinnerModule,
    RouterLink,
  ],
  templateUrl: './current-measurements-section.html',
  styleUrl: './current-measurements-section.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CurrentMeasurementsSection {
  @Input() timeZone?: AquariumTimeZone;
  @Input() states: readonly CurrentParameterState[] = [];
  @Input() hasParameterTargets = false;
  @Input() loading = false;
  @Input() loadFailed = false;
  readonly retryRequested = output<void>();

  readonly now = signal(systemClock.now());

  label(item: CurrentParameterState): string {
    return parameterPresentationFor(item.parameterId).label;
  }

  unit(item: CurrentParameterState): string {
    return parameterPresentationFor(item.parameterId).unit;
  }

  formatMeasuredAt(item: CurrentParameterState): string {
    return item.measurement?.measuredAt
      ? formatAquariumDateTime(item.measurement.measuredAt, this.timeZone)
      : '';
  }

  formatMeasurementAge(item: CurrentParameterState): string {
    return item.measurement?.measuredAt
      ? measurementAgeFor(item.measurement.measuredAt, this.now()).text
      : '';
  }

  targetText(item: CurrentParameterState): string {
    return item.target
      ? `Objetivo: ${item.target.minimum}–${item.target.maximum} ${this.unit(item)}`
      : 'Sin objetivo configurado';
  }

  statusText(item: CurrentParameterState): string {
    switch (item.interpretation) {
      case 'below':
        return 'Por debajo del objetivo';
      case 'within':
        return 'Dentro del objetivo';
      case 'above':
        return 'Por encima del objetivo';
      default:
        return '';
    }
  }

  retry(): void {
    this.retryRequested.emit();
  }
}
