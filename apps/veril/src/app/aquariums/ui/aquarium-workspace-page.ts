import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LOCAL_WEATHER_READER } from './aquarium-providers';
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
      provide: LOCAL_WEATHER_READER,
      useFactory: () =>
        new InMemoryLocalWeatherReader(new OpenMeteoLocalWeatherReader()),
    },
  ],
})
export class AquariumWorkspacePage {
  readonly workspace = inject(AquariumWorkspaceStore);

  constructor() {
    void this.workspace.load();
  }
}
