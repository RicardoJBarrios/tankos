import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActiveAquariumContext } from '../application/active-aquarium-context';
import { RecordMeasurement } from '../application/record-measurement';
import { ParameterId } from '../domain/measurement';
import { FirebaseKeeperSession } from '../infrastructure/firebase-keeper-session';
import { FirestoreMeasurementRepository } from '../infrastructure/firestore-measurement-repository';
import { KEEPER_SESSION, MEASUREMENT_WRITER } from './aquarium-providers';
import {
  MEASUREMENT_PARAMETER_PRESENTATIONS,
  measurementPresentationFor,
} from './measurement-presentations';

const parameters = MEASUREMENT_PARAMETER_PRESENTATIONS;

type PageState = 'ready' | 'saving' | 'success' | 'error';

function currentDateTimeLocal(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

@Component({
  selector: 'veril-record-measurement-page',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './record-measurement-page.html',
  styleUrl: './record-measurement-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: RecordMeasurement,
      useFactory: () =>
        new RecordMeasurement(
          inject(MEASUREMENT_WRITER),
          inject(KEEPER_SESSION),
          inject(ActiveAquariumContext),
        ),
    },
    {
      provide: MEASUREMENT_WRITER,
      useClass: FirestoreMeasurementRepository,
    },
    { provide: KEEPER_SESSION, useClass: FirebaseKeeperSession },
  ],
})
export class RecordMeasurementPage {
  private readonly recordMeasurement = inject(RecordMeasurement);
  private readonly activeContext = inject(ActiveAquariumContext);

  readonly parameters = parameters;
  readonly state = signal<PageState>('ready');
  readonly errorMessage = signal('');
  readonly form = new FormGroup({
    parameterId: new FormControl<ParameterId>('temperature', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    value: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    measuredAt: new FormControl(currentDateTimeLocal(), {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  get hasActiveContext(): boolean {
    return this.activeContext.get() !== null;
  }

  get selectedUnit(): string {
    const parameterId = this.form.controls.parameterId.value;
    return measurementPresentationFor(parameterId).unit;
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const value = Number(this.form.controls.value.value);
    const measuredAt = new Date(this.form.controls.measuredAt.value);
    if (!Number.isFinite(value) || Number.isNaN(measuredAt.getTime())) {
      this.form.controls.value.markAsTouched();
      return;
    }

    this.state.set('saving');
    this.errorMessage.set('');

    try {
      await this.recordMeasurement.execute(
        this.form.controls.parameterId.value,
        value,
        measuredAt,
      );
      this.form.controls.value.reset();
      this.state.set('success');
    } catch {
      this.errorMessage.set(
        'No se ha podido guardar la medición. Inténtalo de nuevo.',
      );
      this.state.set('error');
    }
  }
}
