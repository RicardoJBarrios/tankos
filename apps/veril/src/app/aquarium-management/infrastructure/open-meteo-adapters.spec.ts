import { provideHttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { OpenMeteoLocalWeatherReader } from './open-meteo-local-weather-reader';
import { OpenMeteoLocationSearch } from './open-meteo-location-search';

describe('Open-Meteo adapters', () => {
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        OpenMeteoLocationSearch,
        OpenMeteoLocalWeatherReader,
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('maps a geocoding result without exposing provider DTOs', async () => {
    const result = TestBed.inject(OpenMeteoLocationSearch).search('Santa Cruz');
    const request = http.expectOne(
      (item) => item.url === 'https://geocoding-api.open-meteo.com/v1/search',
    );

    expect(request.request.params.get('count')).toBe('5');
    expect(request.request.params.get('language')).toBe('es');
    request.flush({
      results: [
        {
          name: 'Santa Cruz',
          admin1: 'Canarias',
          country: 'España',
          latitude: 28.12,
          longitude: -16.46,
          timezone: 'Atlantic/Canary',
        },
      ],
    });

    await expect(result).resolves.toEqual([
      expect.objectContaining({
        displayName: 'Santa Cruz, Canarias, España',
        latitude: 28.12,
        suggestedTimeZone: 'Atlantic/Canary',
      }),
    ]);
  });

  it('maps Celsius weather and rejects malformed provider data', async () => {
    const result = TestBed.inject(OpenMeteoLocalWeatherReader).read({
      latitude: 28.12,
      longitude: -16.46,
      displayName: 'Santa Cruz',
    });
    const request = http.expectOne(
      (item) => item.url === 'https://api.open-meteo.com/v1/forecast',
    );

    expect(request.request.params.get('temperature_unit')).toBe('celsius');
    expect(request.request.params.get('timezone')).toBe('auto');
    request.flush({
      current: { temperature_2m: 24.1, time: 1786356000 },
      daily: { temperature_2m_min: [19.2], temperature_2m_max: [27.8] },
    });

    await expect(result).resolves.toMatchObject({
      currentTemperature: 24.1,
      todayMinTemperature: 19.2,
      todayMaxTemperature: 27.8,
      observedAt: new Date(1786356000 * 1000),
    });

    const malformed = TestBed.inject(OpenMeteoLocalWeatherReader).read({
      latitude: 28.12,
      longitude: -16.46,
      displayName: 'Santa Cruz',
    });
    http
      .expectOne(
        (item) => item.url === 'https://api.open-meteo.com/v1/forecast',
      )
      .flush({});
    await expect(malformed).rejects.toThrow();
  });

  it('propagates unavailable and transport-timeout provider errors', async () => {
    const unavailable = TestBed.inject(OpenMeteoLocationSearch).search(
      'Santa Cruz',
    );
    http
      .expectOne(
        (item) => item.url === 'https://geocoding-api.open-meteo.com/v1/search',
      )
      .flush('unavailable', {
        status: 503,
        statusText: 'Service Unavailable',
      });
    await expect(unavailable).rejects.toThrow(HttpErrorResponse);

    const timeout = TestBed.inject(OpenMeteoLocalWeatherReader).read({
      latitude: 28.12,
      longitude: -16.46,
      displayName: 'Santa Cruz',
    });
    http
      .expectOne(
        (item) => item.url === 'https://api.open-meteo.com/v1/forecast',
      )
      .error(new ProgressEvent('timeout'));
    await expect(timeout).rejects.toThrow(HttpErrorResponse);
  });
});
