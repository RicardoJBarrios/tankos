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
import { ActiveAquariumContext } from '../application/active-aquarium-context';
import { RecordMeasurement } from '../application/record-measurement';
import { canonicalUnitFor, ParameterId } from '../domain/measurement';
import { FirebaseKeeperSession } from '../infrastructure/firebase-keeper-session';
import { FirestoreMeasurementRepository } from '../infrastructure/firestore-measurement-repository';
import { KEEPER_SESSION, MEASUREMENT_WRITER } from './aquarium-providers';

type PageState = 'ready' | 'saving' | 'success' | 'error';

const parameters: readonly {
  readonly id: ParameterId;
  readonly label: string;
  readonly unit: string;
}[] = [
  { id: 'temperature', label: 'Temperatura', unit: '°C' },
  { id: 'salinity', label: 'Salinidad', unit: 'ppt' },
  { id: 'alkalinity', label: 'Alcalinidad', unit: 'dKH' },
  { id: 'nitrate', label: 'Nitrato', unit: 'mg/L as NO₃' },
  { id: 'phosphate', label: 'Fosfato', unit: 'mg/L as PO₄' },
];

function currentDateTimeLocal(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

@Component({
  selector: 'veril-record-measurement-page',
  imports: [ReactiveFormsModule],
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
    return (
      this.parameters.find((parameter) => parameter.id === parameterId)?.unit ??
      canonicalUnitFor(parameterId)
    );
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
