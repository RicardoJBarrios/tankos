import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActiveAquariumContext } from '../../../shared/application/active-aquarium-context';
import { ConfigureAquariumLocation } from '../../application/configure-aquarium-location';
import { SearchAquariumLocations } from '../../application/search-aquarium-locations';
import { AquariumLocation } from '../../domain/aquarium';
import {
  AQUARIUM_LOCATION_CONFIGURER,
  AQUARIUM_REPOSITORY,
  KEEPER_SESSION,
  LOCATION_SEARCH,
} from '../providers';

type PageState =
  | 'loading'
  | 'ready'
  | 'searching'
  | 'results'
  | 'no-results'
  | 'saving'
  | 'success'
  | 'already-configured'
  | 'failure'
  | 'no-context';

@Component({
  selector: 'veril-configure-aquarium-location-page',
  imports: [
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './configure-aquarium-location-page.html',
  styleUrl: './configure-aquarium-location-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: ConfigureAquariumLocation,
      useFactory: () =>
        new ConfigureAquariumLocation(
          inject(AQUARIUM_LOCATION_CONFIGURER),
          inject(KEEPER_SESSION),
          inject(ActiveAquariumContext),
        ),
    },
    {
      provide: SearchAquariumLocations,
      useFactory: () => new SearchAquariumLocations(inject(LOCATION_SEARCH)),
    },
  ],
})
export class ConfigureAquariumLocationPage implements OnInit {
  private readonly configureLocation = inject(ConfigureAquariumLocation);
  private readonly searchLocations = inject(SearchAquariumLocations);
  private readonly aquariumRepository = inject(AQUARIUM_REPOSITORY);
  private readonly keeperSession = inject(KEEPER_SESSION);
  private readonly activeContext = inject(ActiveAquariumContext);

  readonly state = signal<PageState>('loading');
  readonly errorMessage = signal('');
  readonly candidates = signal<
    readonly import('../../application/ports').LocationCandidate[]
  >([]);
  readonly selected = signal<
    import('../../application/ports').LocationCandidate | null
  >(null);
  readonly configuredLocation = signal<AquariumLocation | undefined>(undefined);
  readonly query = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(3)],
  });

  ngOnInit(): void {
    if (!this.activeContext.get()) {
      this.state.set('no-context');
      return;
    }

    void this.load();
  }

  async search(): Promise<void> {
    if (this.query.invalid) {
      this.query.markAsTouched();
      return;
    }

    this.state.set('searching');
    this.errorMessage.set('');
    this.selected.set(null);
    try {
      const results = await this.searchLocations.execute(this.query.value);
      this.candidates.set(results);
      this.state.set(results.length ? 'results' : 'no-results');
    } catch {
      this.errorMessage.set(
        'No se ha podido buscar esa ubicación. Inténtalo de nuevo.',
      );
      this.state.set('failure');
    }
  }

  select(candidate: import('../../application/ports').LocationCandidate): void {
    this.selected.set(candidate);
  }

  async submit(): Promise<void> {
    const candidate = this.selected();
    if (!candidate) {
      return;
    }

    this.state.set('saving');
    this.errorMessage.set('');
    try {
      const location = await this.configureLocation.execute(candidate);
      this.configuredLocation.set(location);
      this.state.set('success');
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === 'Aquarium location is already configured'
      ) {
        this.state.set('already-configured');
        return;
      }

      this.errorMessage.set(
        'No se ha podido configurar la ubicación. Inténtalo de nuevo.',
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

      if (aquarium.location) {
        this.configuredLocation.set(aquarium.location);
        this.state.set('already-configured');
        return;
      }

      this.state.set('ready');
    } catch {
      this.state.set('failure');
    }
  }
}
