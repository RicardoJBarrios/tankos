import { z } from 'zod';
import { LocalWeatherReader } from '../application/aquarium-ports';
import { AquariumLocation } from '../domain/aquarium';
import { fetchWithTimeout } from './fetch-with-timeout';

const responseSchema = z.object({
  current: z.object({
    temperature_2m: z.number().finite(),
    time: z.union([z.number(), z.string()]).optional(),
  }),
  daily: z.object({
    temperature_2m_min: z.array(z.number().finite()).min(1),
    temperature_2m_max: z.array(z.number().finite()).min(1),
  }),
});

function observedAtFrom(value: number | string | undefined): Date | undefined {
  if (typeof value === 'number') {
    const date = new Date(value * 1000);
    return Number.isNaN(date.getTime()) ? undefined : date;
  }

  return undefined;
}

export class OpenMeteoLocalWeatherReader implements LocalWeatherReader {
  async read(
    location: AquariumLocation,
  ): Promise<Awaited<ReturnType<LocalWeatherReader['read']>>> {
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.searchParams.set('latitude', String(location.latitude));
    url.searchParams.set('longitude', String(location.longitude));
    url.searchParams.set('current', 'temperature_2m');
    url.searchParams.set('daily', 'temperature_2m_min,temperature_2m_max');
    url.searchParams.set('temperature_unit', 'celsius');
    url.searchParams.set('timezone', 'auto');
    url.searchParams.set('forecast_days', '1');
    url.searchParams.set('timeformat', 'unixtime');

    const response = await fetchWithTimeout(url);
    if (!response.ok) {
      throw new Error('Local weather unavailable');
    }

    const data = responseSchema.parse(await response.json());
    const fetchedAt = new Date();
    const observedAt = observedAtFrom(data.current.time);

    return {
      currentTemperature: data.current.temperature_2m,
      todayMinTemperature: data.daily.temperature_2m_min[0],
      todayMaxTemperature: data.daily.temperature_2m_max[0],
      ...(observedAt ? { observedAt } : {}),
      fetchedAt,
    };
  }
}
