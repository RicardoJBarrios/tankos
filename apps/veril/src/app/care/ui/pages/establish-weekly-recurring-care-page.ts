import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActiveAquariumContext } from '../../../shared/application/active-aquarium-context';
import { EstablishWeeklyRecurringCare } from '../../application/establish-weekly-recurring-care';
import {
  AquariumTimeZone,
  aquariumTimeZoneFrom,
} from '../../../shared/domain/aquarium-reference';
import {
  CARE_AQUARIUM_CONTEXT_READER,
  KEEPER_SESSION,
  RECURRING_CARE_PLAN_WRITER,
} from '../providers';
import { formatAquariumDateTimeLocal } from '../../../shared/ui/aquarium-date-time';

type PageState =
  | 'loading'
  | 'ready'
  | 'saving'
  | 'success'
  | 'error'
  | 'no-context'
  | 'failure';

function defaultTimeZone(): string {
  return new Intl.DateTimeFormat().resolvedOptions().timeZone || '';
}

function defaultDateTime(timeZone?: AquariumTimeZone): string {
  const now = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return formatAquariumDateTimeLocal(now, timeZone);
}

@Component({
  selector: 'veril-establish-weekly-recurring-care-page',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './establish-weekly-recurring-care-page.html',
  styleUrl: './establish-weekly-recurring-care-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: EstablishWeeklyRecurringCare,
      useFactory: () =>
        new EstablishWeeklyRecurringCare(
          inject(RECURRING_CARE_PLAN_WRITER),
          inject(KEEPER_SESSION),
          inject(ActiveAquariumContext),
        ),
    },
  ],
})
export class EstablishWeeklyRecurringCarePage implements OnInit {
  private readonly useCase = inject(EstablishWeeklyRecurringCare);
  private readonly aquariumContextReader = inject(CARE_AQUARIUM_CONTEXT_READER);
  private readonly keeperSession = inject(KEEPER_SESSION);
  private readonly activeContext = inject(ActiveAquariumContext);
  private readonly router = inject(Router);

  readonly state = signal<PageState>('loading');
  readonly errorMessage = signal('');
  readonly aquariumTimeZone = signal('');
  readonly timeZoneConfirmed = signal(false);
  readonly form = new FormGroup({
    description: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    firstOccurrenceLocal: new FormControl(defaultDateTime(), {
      nonNullable: true,
      validators: [Validators.required],
    }),
    timeZone: new FormControl(defaultTimeZone(), {
      nonNullable: true,
      validators: [Validators.required],
    }),
    confirmTimeZone: new FormControl(false, { nonNullable: true }),
  });

  ngOnInit(): void {
    if (!this.activeContext.get()) {
      this.state.set('no-context');
      return;
    }
    void this.load();
  }

  get needsTimeZoneConfirmation(): boolean {
    return !this.aquariumTimeZone();
  }

  confirmZone(): void {
    this.timeZoneConfirmed.set(this.form.controls.confirmTimeZone.value);
  }

  async submit(): Promise<void> {
    if (
      this.form.invalid ||
      (this.needsTimeZoneConfirmation && !this.timeZoneConfirmed())
    ) {
      this.form.markAllAsTouched();
      return;
    }
    try {
      const zone = aquariumTimeZoneFrom(this.form.controls.timeZone.value);
      this.state.set('saving');
      this.errorMessage.set('');
      await this.useCase.execute(
        this.form.controls.description.value,
        this.form.controls.firstOccurrenceLocal.value,
        zone,
      );
      this.state.set('success');
    } catch {
      this.errorMessage.set(
        'No se ha podido establecer la recurrencia. Revisa los datos e inténtalo de nuevo.',
      );
      this.state.set('error');
    }
  }

  private async load(): Promise<void> {
    try {
      const keeper = await this.keeperSession.requireAuthenticatedKeeper();
      const aquariumId = this.activeContext.get();
      if (!aquariumId) {
        this.state.set('no-context');
        return;
      }
      const aquarium = await this.aquariumContextReader.getOwned(
        keeper.id,
        aquariumId,
      );
      if (!aquarium) {
        this.state.set('failure');
        return;
      }
      if (aquarium.timeZone) {
        this.aquariumTimeZone.set(aquarium.timeZone);
        this.form.controls.timeZone.setValue(aquarium.timeZone);
      }
      this.form.controls.firstOccurrenceLocal.setValue(
        defaultDateTime(aquarium.timeZone),
      );
      this.state.set('ready');
    } catch {
      this.state.set('failure');
    }
  }
}
