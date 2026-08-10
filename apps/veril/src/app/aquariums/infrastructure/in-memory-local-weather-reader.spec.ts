import { describe, expect, it, vi } from 'vitest';
import { InMemoryLocalWeatherReader } from './in-memory-local-weather-reader';

describe('InMemoryLocalWeatherReader', () => {
  it('caches for fifteen minutes and refreshes explicitly', async () => {
    const delegate = {
      read: vi.fn().mockResolvedValue({
        currentTemperature: 24,
        todayMinTemperature: 19,
        todayMaxTemperature: 27,
        fetchedAt: new Date(),
      }),
    };
    let now = new Date('2026-08-10T10:00:00Z');
    const reader = new InMemoryLocalWeatherReader(delegate, () => now);
    const location = {
      latitude: 28.12,
      longitude: -16.46,
      displayName: 'Santa Cruz',
    };

    await reader.read(location);
    await reader.read(location);
    expect(delegate.read).toHaveBeenCalledTimes(1);
    now = new Date('2026-08-10T10:16:00Z');
    await reader.read(location);
    await reader.read(location, { forceRefresh: true });
    expect(delegate.read).toHaveBeenCalledTimes(3);
  });
});
