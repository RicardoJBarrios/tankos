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
import { ActiveAquariumContext } from '../../../shared/application/active-aquarium-context';
import { RecordMeasurement } from '../../application/record-measurement';
import { ParameterId } from '../../domain/measurement';
import { KEEPER_SESSION, MEASUREMENT_WRITER } from '../providers';
import {
  PARAMETER_PRESENTATIONS,
  parameterPresentationFor,
} from '../../../shared/ui/parameter-presentation';
import { currentDateTimeLocal } from '../../../shared/ui/date-time-input';
import { FormPageState } from '../../../shared/ui/page-state';

const parameters = PARAMETER_PRESENTATIONS;

type PageState = FormPageState;

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
    return parameterPresentationFor(parameterId).unit;
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
