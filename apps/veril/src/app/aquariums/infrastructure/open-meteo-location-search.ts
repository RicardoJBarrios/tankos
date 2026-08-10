import { z } from 'zod';
import {
  LocationCandidate,
  LocationSearch,
} from '../application/aquarium-ports';
import { fetchWithTimeout } from './fetch-with-timeout';

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

export class OpenMeteoLocationSearch implements LocationSearch {
  async search(query: string): Promise<readonly LocationCandidate[]> {
    const url = new URL('https://geocoding-api.open-meteo.com/v1/search');
    url.searchParams.set('name', query);
    url.searchParams.set('count', '5');
    url.searchParams.set('language', 'es');

    const response = await fetchWithTimeout(url);
    if (!response.ok) {
      throw new Error('Location search unavailable');
    }

    const data = responseSchema.parse(await response.json());
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
