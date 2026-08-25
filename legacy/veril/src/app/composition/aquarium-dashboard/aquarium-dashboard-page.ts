import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CurrentMeasurementsSection } from '../../measurements/ui/sections/current-measurements-section';
import { RecentActivityPreview } from '../../timeline/ui/previews/recent-activity-preview';
import { UpcomingCarePreview } from '../../care/ui/previews/upcoming-care-preview';
import { LocalWeatherSection } from '../../aquarium-management/ui/sections/local-weather-section';
import { AquariumDashboardStore } from './aquarium-dashboard-store';

@Component({
  selector: 'veril-aquarium-dashboard-page',
  imports: [
    CurrentMeasurementsSection,
    RecentActivityPreview,
    UpcomingCarePreview,
    LocalWeatherSection,
    MatButtonModule,
    MatProgressSpinnerModule,
    RouterLink,
  ],
  templateUrl: './aquarium-dashboard-page.html',
  styleUrl: './aquarium-dashboard-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AquariumDashboardPage {
  readonly dashboard = inject(AquariumDashboardStore);

  constructor() {
    void this.dashboard.load();
  }
}
