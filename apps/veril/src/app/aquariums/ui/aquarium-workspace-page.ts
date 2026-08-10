import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ListMyAquariums } from '../application/list-my-aquariums';
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
import { AquariumWorkspaceStore } from './aquarium-workspace-store';

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
    AquariumWorkspaceStore,
  ],
})
export class AquariumWorkspacePage {
  readonly workspace = inject(AquariumWorkspaceStore);

  constructor() {
    void this.workspace.load();
  }
}
