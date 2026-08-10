import {
  ChangeDetectionStrategy,
  Component,
  Input,
  inject,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CurrentParameterState } from '../application/parameter-status';
import { AquariumTimeZone } from '../domain/aquarium';
import { RouterLink } from '@angular/router';
import { AquariumWorkspaceStore } from './aquarium-workspace-store';
import { measurementPresentationFor } from './measurement-presentations';
import { formatAquariumDateTime } from './aquarium-date-time';
import { measurementAgeFor } from './measurement-age';

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

  readonly workspace = inject(AquariumWorkspaceStore);
  readonly now = signal(new Date());

  label(item: CurrentParameterState): string {
    return measurementPresentationFor(item.parameterId).label;
  }

  unit(item: CurrentParameterState): string {
    return measurementPresentationFor(item.parameterId).unit;
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
    void this.workspace.loadCurrentMeasurements();
  }
}
