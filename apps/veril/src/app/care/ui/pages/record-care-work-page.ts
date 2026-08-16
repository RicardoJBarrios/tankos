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
import { RecordCareWork } from '../../application/record-care-work';
import { CARE_WORK_WRITER, KEEPER_SESSION } from '../providers';
import { currentDateTimeLocal } from '../../../shared/ui/date-time-input';
import { FormPageState } from '../../../shared/ui/page-state';

type PageState = FormPageState;

@Component({
  selector: 'veril-record-care-work-page',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './record-care-work-page.html',
  styleUrl: './record-care-work-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: RecordCareWork,
      useFactory: () =>
        new RecordCareWork(
          inject(CARE_WORK_WRITER),
          inject(KEEPER_SESSION),
          inject(ActiveAquariumContext),
        ),
    },
  ],
})
export class RecordCareWorkPage {
  private readonly recordCareWork = inject(RecordCareWork);
  private readonly activeContext = inject(ActiveAquariumContext);

  readonly state = signal<PageState>('ready');
  readonly errorMessage = signal('');
  readonly form = new FormGroup({
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    performedAt: new FormControl(currentDateTimeLocal(), {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  get hasActiveContext(): boolean {
    return this.activeContext.get() !== null;
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const performedAt = new Date(this.form.controls.performedAt.value);
    if (Number.isNaN(performedAt.getTime())) {
      this.form.controls.performedAt.markAsTouched();
      return;
    }

    this.state.set('saving');
    this.errorMessage.set('');

    try {
      await this.recordCareWork.execute(
        this.form.controls.description.value,
        performedAt,
      );
      this.form.reset({ performedAt: currentDateTimeLocal() });
      this.state.set('success');
    } catch {
      this.errorMessage.set(
        'No se ha podido guardar el cuidado. Inténtalo de nuevo.',
      );
      this.state.set('error');
    }
  }
}
