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
import { PlanCareWork } from '../../application/plan-care-work';
import { KEEPER_SESSION, PLANNED_CARE_WORK_WRITER } from '../providers';

type PageState = 'ready' | 'saving' | 'success' | 'error';

function currentDateTimeLocal(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

@Component({
  selector: 'veril-plan-care-work-page',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './plan-care-work-page.html',
  styleUrl: './plan-care-work-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: PlanCareWork,
      useFactory: () =>
        new PlanCareWork(
          inject(PLANNED_CARE_WORK_WRITER),
          inject(KEEPER_SESSION),
          inject(ActiveAquariumContext),
        ),
    },
  ],
})
export class PlanCareWorkPage {
  private readonly planCareWork = inject(PlanCareWork);
  private readonly activeContext = inject(ActiveAquariumContext);

  readonly state = signal<PageState>('ready');
  readonly errorMessage = signal('');
  readonly form = new FormGroup({
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    plannedFor: new FormControl(currentDateTimeLocal(), {
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

    const plannedFor = new Date(this.form.controls.plannedFor.value);
    if (Number.isNaN(plannedFor.getTime())) {
      this.form.controls.plannedFor.markAsTouched();
      return;
    }

    this.state.set('saving');
    this.errorMessage.set('');

    try {
      await this.planCareWork.execute(
        this.form.controls.description.value,
        plannedFor,
      );
      this.state.set('success');
    } catch {
      this.errorMessage.set(
        'No se ha podido planificar el cuidado. Inténtalo de nuevo.',
      );
      this.state.set('error');
    }
  }
}
