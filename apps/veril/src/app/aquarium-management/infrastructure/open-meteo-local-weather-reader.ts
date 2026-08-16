import { z } from 'zod';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { timeout } from 'rxjs/operators';
import { LocalWeatherReader } from '../application/ports';
import { AquariumLocation } from '../domain/aquarium';

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

@Injectable()
export class OpenMeteoLocalWeatherReader implements LocalWeatherReader {
  private readonly http = inject(HttpClient);

  async read(
    location: AquariumLocation,
  ): Promise<Awaited<ReturnType<LocalWeatherReader['read']>>> {
    const data = responseSchema.parse(
      await firstValueFrom(
        this.http
          .get<unknown>('https://api.open-meteo.com/v1/forecast', {
            params: new HttpParams()
              .set('latitude', String(location.latitude))
              .set('longitude', String(location.longitude))
              .set('current', 'temperature_2m')
              .set('daily', 'temperature_2m_min,temperature_2m_max')
              .set('temperature_unit', 'celsius')
              .set('timezone', 'auto')
              .set('forecast_days', '1')
              .set('timeformat', 'unixtime'),
          })
          .pipe(timeout({ first: 10_000 })),
      ),
    );
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
