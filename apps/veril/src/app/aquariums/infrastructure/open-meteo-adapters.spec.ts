import { afterEach, describe, expect, it, vi } from 'vitest';
import { OpenMeteoLocalWeatherReader } from './open-meteo-local-weather-reader';
import { OpenMeteoLocationSearch } from './open-meteo-location-search';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('Open-Meteo adapters', () => {
  it('maps a geocoding result without exposing provider DTOs', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
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
          }),
          { status: 200 },
        ),
      ),
    );

    await expect(
      new OpenMeteoLocationSearch().search('Santa Cruz'),
    ).resolves.toEqual([
      expect.objectContaining({
        displayName: 'Santa Cruz, Canarias, España',
        latitude: 28.12,
        suggestedTimeZone: 'Atlantic/Canary',
      }),
    ]);
  });

  it('maps Celsius weather and rejects malformed provider data', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            current: { temperature_2m: 24.1, time: 1786356000 },
            daily: { temperature_2m_min: [19.2], temperature_2m_max: [27.8] },
          }),
          { status: 200 },
        ),
      ),
    );

    await expect(
      new OpenMeteoLocalWeatherReader().read({
        latitude: 28.12,
        longitude: -16.46,
        displayName: 'Santa Cruz',
      }),
    ).resolves.toMatchObject({
      currentTemperature: 24.1,
      todayMinTemperature: 19.2,
      todayMaxTemperature: 27.8,
      observedAt: new Date(1786356000 * 1000),
    });

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('{}', { status: 200 })),
    );
    await expect(
      new OpenMeteoLocalWeatherReader().read({
        latitude: 28.12,
        longitude: -16.46,
        displayName: 'Santa Cruz',
      }),
    ).rejects.toThrow();
  });

  it('rejects unavailable and timed-out provider requests', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('', { status: 503 })),
    );
    await expect(
      new OpenMeteoLocationSearch().search('Santa Cruz'),
    ).rejects.toThrow('Location search unavailable');

    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_, init?: RequestInit) =>
          new Promise<Response>((_, reject) => {
            init?.signal?.addEventListener('abort', () =>
              reject(new DOMException('Aborted', 'AbortError')),
            );
          }),
      ),
    );

    const request = new OpenMeteoLocalWeatherReader().read({
      latitude: 28.12,
      longitude: -16.46,
      displayName: 'Santa Cruz',
    });
    const rejectedRequest = expect(request).rejects.toThrow('Aborted');
    await vi.advanceTimersByTimeAsync(10_000);
    await rejectedRequest;
  });
});
