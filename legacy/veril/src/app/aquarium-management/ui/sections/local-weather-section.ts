import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { LocalWeather } from '../../application/ports';
import { AquariumLocation } from '../../domain/aquarium';
import { LOCAL_WEATHER_READER } from '../providers';

type WeatherState = 'loading' | 'ready' | 'failure';

@Component({
  selector: 'veril-local-weather-section',
  imports: [DatePipe, MatButtonModule, MatCardModule, MatProgressSpinnerModule],
  templateUrl: './local-weather-section.html',
  styleUrl: './local-weather-section.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [],
})
export class LocalWeatherSection implements OnChanges {
  @Input({ required: true }) location!: AquariumLocation;

  private readonly reader = inject(LOCAL_WEATHER_READER);
  readonly state = signal<WeatherState>('loading');
  readonly weather = signal<LocalWeather | null>(null);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['location'] && this.location) {
      void this.load();
    }
  }

  refresh(): void {
    void this.load(true);
  }

  private async load(forceRefresh = false): Promise<void> {
    this.state.set('loading');
    try {
      this.weather.set(await this.reader.read(this.location, { forceRefresh }));
      this.state.set('ready');
    } catch {
      this.state.set('failure');
    }
  }
}
