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
import { LocalWeather } from '../application/aquarium-ports';
import { AquariumLocation } from '../domain/aquarium';
import { LOCAL_WEATHER_READER } from './aquarium-providers';

type WeatherState = 'loading' | 'ready' | 'failure';

@Component({
  selector: 'veril-local-weather-section',
  imports: [DatePipe, MatButtonModule, MatCardModule, MatProgressSpinnerModule],
  template: `
    <section aria-labelledby="local-weather-title" data-testid="local-weather">
      <div class="section-heading">
        <div>
          <p class="eyebrow">Entorno</p>
          <h3 id="local-weather-title">Tiempo local</h3>
        </div>
        <button
          mat-button
          type="button"
          (click)="refresh()"
          [disabled]="state() === 'loading'"
        >
          Actualizar
        </button>
      </div>
      @if (state() === 'loading') {
        <p role="status">Cargando tiempo local…</p>
      } @else if (state() === 'failure') {
        <p role="alert">No se ha podido consultar el tiempo local.</p>
        <button mat-stroked-button type="button" (click)="refresh()">
          Reintentar
        </button>
      } @else if (weather(); as value) {
        <mat-card appearance="outlined">
          <mat-card-content>
            <p>
              <strong>{{ value.currentTemperature }} °C</strong> ahora en
              {{ location.displayName }}
            </p>
            <p>
              Hoy: {{ value.todayMinTemperature }}–{{
                value.todayMaxTemperature
              }}
              °C
            </p>
            <p class="weather-meta">
              Datos consultados {{ value.fetchedAt | date: 'short' }}
            </p>
            <p class="weather-meta">Fuente: Open-Meteo</p>
          </mat-card-content>
        </mat-card>
      }
    </section>
  `,
  styles: [
    `
      section {
        margin: 2rem 0;
      }
      .section-heading {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
      }
      .eyebrow {
        margin: 0 0 0.25rem;
        color: var(--mat-sys-primary);
        font: var(--mat-sys-label-large);
        font-weight: 700;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }
      h3 {
        margin: 0;
        font: var(--mat-sys-headline-small);
      }
      .weather-meta {
        color: var(--mat-sys-on-surface-variant);
        font: var(--mat-sys-body-small);
      }
    `,
  ],
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
