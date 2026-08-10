import { z } from 'zod';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { timeout } from 'rxjs/operators';
import {
  LocationCandidate,
  LocationSearch,
} from '../application/aquarium-ports';

const responseSchema = z.object({
  results: z
    .array(
      z.object({
        name: z.string().min(1),
        latitude: z.number().finite(),
        longitude: z.number().finite(),
        country: z.string().optional(),
        admin1: z.string().optional(),
        timezone: z.string().optional(),
      }),
    )
    .optional(),
});

@Injectable()
export class OpenMeteoLocationSearch implements LocationSearch {
  private readonly http = inject(HttpClient);

  async search(query: string): Promise<readonly LocationCandidate[]> {
    const data = responseSchema.parse(
      await firstValueFrom(
        this.http
          .get<unknown>('https://geocoding-api.open-meteo.com/v1/search', {
            params: new HttpParams()
              .set('name', query)
              .set('count', '5')
              .set('language', 'es'),
          })
          .pipe(timeout({ first: 10_000 })),
      ),
    );
    return (data.results ?? []).map((result) => ({
      latitude: result.latitude,
      longitude: result.longitude,
      displayName: [result.name, result.admin1, result.country]
        .filter(Boolean)
        .join(', '),
      ...(result.country ? { country: result.country } : {}),
      ...(result.admin1 ? { region: result.admin1 } : {}),
      ...(result.timezone ? { suggestedTimeZone: result.timezone } : {}),
    }));
  }
}
