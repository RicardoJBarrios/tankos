import { LocalWeather, LocalWeatherReader } from '../application/ports';
import { AquariumLocation } from '../domain/aquarium';

export class InMemoryLocalWeatherReader implements LocalWeatherReader {
  private readonly entries = new Map<
    string,
    { readonly weather: LocalWeather; readonly expiresAt: number }
  >();

  constructor(
    private readonly delegate: LocalWeatherReader,
    private readonly now: () => Date = () => new Date(),
    private readonly ttlMs = 15 * 60 * 1000,
  ) {}

  async read(
    location: AquariumLocation,
    options?: { readonly forceRefresh?: boolean },
  ): Promise<LocalWeather> {
    const key = `${location.latitude},${location.longitude}`;
    const cached = this.entries.get(key);
    const now = this.now().getTime();
    if (!options?.forceRefresh && cached && cached.expiresAt > now) {
      return cached.weather;
    }

    const weather = await this.delegate.read(location);
    this.entries.set(key, {
      weather,
      expiresAt: now + this.ttlMs,
    });
    return weather;
  }
}
