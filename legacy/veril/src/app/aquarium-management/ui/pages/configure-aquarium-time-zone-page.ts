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
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActiveAquariumContext } from '../../../shared/application/active-aquarium-context';
import { ConfigureAquariumTimeZone } from '../../application/configure-aquarium-time-zone';
import { AquariumTimeZone } from '../../domain/aquarium';
import {
  AQUARIUM_REPOSITORY,
  AQUARIUM_TIME_ZONE_CONFIGURER,
  KEEPER_SESSION,
} from '../providers';

type PageState =
  | 'loading'
  | 'ready'
  | 'saving'
  | 'success'
  | 'already-configured'
  | 'failure'
  | 'no-context';

function browserTimeZone(): string {
  return new Intl.DateTimeFormat().resolvedOptions().timeZone || '';
}

function supportedTimeZones(): readonly string[] {
  const intl = Intl as typeof Intl & {
    supportedValuesOf?: (key: 'timeZone') => string[];
  };

  return typeof intl.supportedValuesOf === 'function'
    ? intl.supportedValuesOf('timeZone')
    : [];
}

@Component({
  selector: 'veril-configure-aquarium-time-zone-page',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './configure-aquarium-time-zone-page.html',
  styleUrl: './configure-aquarium-time-zone-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: ConfigureAquariumTimeZone,
      useFactory: () =>
        new ConfigureAquariumTimeZone(
          inject(AQUARIUM_TIME_ZONE_CONFIGURER),
          inject(KEEPER_SESSION),
          inject(ActiveAquariumContext),
        ),
    },
  ],
})
export class ConfigureAquariumTimeZonePage implements OnInit {
  private readonly useCase = inject(ConfigureAquariumTimeZone);
  private readonly aquariumRepository = inject(AQUARIUM_REPOSITORY);
  private readonly keeperSession = inject(KEEPER_SESSION);
  private readonly activeContext = inject(ActiveAquariumContext);

  readonly state = signal<PageState>('loading');
  readonly errorMessage = signal('');
  readonly configuredTimeZone = signal<AquariumTimeZone | undefined>(undefined);
  readonly timeZones = supportedTimeZones();
  readonly form = new FormGroup({
    timeZone: new FormControl(browserTimeZone(), {
      nonNullable: true,
      validators: [Validators.required],
    }),
    confirm: new FormControl(false, { nonNullable: true }),
  });

  ngOnInit(): void {
    if (!this.activeContext.get()) {
      this.state.set('no-context');
      return;
    }

    void this.load();
  }

  async submit(): Promise<void> {
    if (this.form.invalid || !this.form.controls.confirm.value) {
      this.form.markAllAsTouched();
      return;
    }

    this.state.set('saving');
    this.errorMessage.set('');

    try {
      const timeZone = await this.useCase.execute(
        this.form.controls.timeZone.value,
      );
      this.configuredTimeZone.set(timeZone);
      this.state.set('success');
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === 'Aquarium time zone is already configured'
      ) {
        this.state.set('already-configured');
        return;
      }

      this.errorMessage.set(
        'No se ha podido configurar la zona horaria. Revisa el valor e inténtalo de nuevo.',
      );
      this.state.set('failure');
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

      const aquarium = await this.aquariumRepository.getOwned(
        keeper.id,
        aquariumId,
      );
      if (!aquarium) {
        this.state.set('failure');
        return;
      }

      if (aquarium.timeZone) {
        this.configuredTimeZone.set(aquarium.timeZone);
        this.state.set('already-configured');
        return;
      }

      this.state.set('ready');
    } catch {
      this.state.set('failure');
    }
  }
}
