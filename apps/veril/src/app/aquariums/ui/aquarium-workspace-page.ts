import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActiveAquariumContext } from '../application/active-aquarium-context';
import { ListMyAquariums } from '../application/list-my-aquariums';
import { AquariumLocation, AquariumTimeZone } from '../domain/aquarium';
import {
  AQUARIUM_REPOSITORY,
  KEEPER_SESSION,
  LOCAL_WEATHER_READER,
} from './aquarium-providers';
import { FirebaseKeeperSession } from '../infrastructure/firebase-keeper-session';
import { FirestoreAquariumRepository } from '../infrastructure/firestore-aquarium-repository';
import { CurrentMeasurementsSection } from './current-measurements-section';
import { RecentActivityPreview } from './recent-activity-preview';
import { UpcomingCarePreview } from './upcoming-care-preview';
import { LocalWeatherSection } from './local-weather-section';
import { InMemoryLocalWeatherReader } from '../infrastructure/in-memory-local-weather-reader';
import { OpenMeteoLocalWeatherReader } from '../infrastructure/open-meteo-local-weather-reader';

type WorkspaceState = 'loading' | 'ready' | 'no-context' | 'failure';

@Component({
  selector: 'veril-aquarium-workspace-page',
  imports: [
    CurrentMeasurementsSection,
    RecentActivityPreview,
    UpcomingCarePreview,
    LocalWeatherSection,
    MatButtonModule,
    MatProgressSpinnerModule,
    RouterLink,
  ],
  templateUrl: './aquarium-workspace-page.html',
  styleUrl: './aquarium-workspace-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: ListMyAquariums,
      useFactory: () =>
        new ListMyAquariums(
          inject(AQUARIUM_REPOSITORY),
          inject(KEEPER_SESSION),
        ),
    },
    { provide: AQUARIUM_REPOSITORY, useClass: FirestoreAquariumRepository },
    { provide: KEEPER_SESSION, useClass: FirebaseKeeperSession },
    {
      provide: LOCAL_WEATHER_READER,
      useFactory: () =>
        new InMemoryLocalWeatherReader(new OpenMeteoLocalWeatherReader()),
    },
  ],
})
export class AquariumWorkspacePage implements OnInit {
  private readonly listMyAquariums = inject(ListMyAquariums);
  readonly activeContext = inject(ActiveAquariumContext);

  readonly state = signal<WorkspaceState>('loading');
  readonly aquariumName = signal<string | null>(null);
  readonly aquariumTimeZone = signal<AquariumTimeZone | undefined>(undefined);
  readonly aquariumLocation = signal<AquariumLocation | undefined>(undefined);

  ngOnInit(): void {
    if (!this.activeContext.get()) {
      this.state.set('no-context');
      return;
    }

    void this.loadAquarium();
  }

  private async loadAquarium(): Promise<void> {
    try {
      const activeAquariumId = this.activeContext.get();
      if (!activeAquariumId) {
        this.state.set('no-context');
        return;
      }

      const aquariums = await this.listMyAquariums.execute();
      const aquarium = aquariums.find(({ id }) => id === activeAquariumId);
      if (!aquarium) {
        this.state.set('failure');
        return;
      }

      this.aquariumName.set(aquarium.name.value);
      this.aquariumTimeZone.set(aquarium.timeZone);
      this.aquariumLocation.set(aquarium.location);
      this.state.set('ready');
    } catch {
      this.state.set('failure');
    }
  }
}
