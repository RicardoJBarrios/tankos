import { describe, expect, it } from 'vitest';
import { aquariumTimeZoneFrom } from '../domain/aquarium-reference';
import {
  formatAquariumDateTime,
  formatAquariumDateTimeLocal,
} from './aquarium-date-time';

const canary = aquariumTimeZoneFrom('Atlantic/Canary');

describe('formatAquariumDateTime', () => {
  it('formats an instant in the configured Aquarium timezone', () => {
    const instant = new Date('2026-08-10T18:00:00.000Z');

    expect(formatAquariumDateTime(instant, canary)).toContain('19:00');
  });

  it('does not depend on the host timezone when a timezone is configured', () => {
    const instant = new Date('2026-08-10T18:00:00.000Z');

    expect(formatAquariumDateTime(instant, canary)).toContain('19:00');
    expect(
      formatAquariumDateTime(instant, aquariumTimeZoneFrom('Europe/Madrid')),
    ).toContain('20:00');
    expect(
      formatAquariumDateTime(instant, aquariumTimeZoneFrom('America/New_York')),
    ).toContain('14:00');
  });

  it('uses the browser timezone only for the legacy fallback', () => {
    const instant = new Date('2026-08-10T18:00:00.000Z');
    const expected = new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(instant);

    expect(formatAquariumDateTime(instant)).toBe(expected);
  });

  it('uses the Aquarium timezone across a DST transition', () => {
    expect(
      formatAquariumDateTime(new Date('2026-03-29T00:30:00.000Z'), canary),
    ).toContain('0:30');
    expect(
      formatAquariumDateTime(new Date('2026-03-29T01:30:00.000Z'), canary),
    ).toContain('2:30');
  });

  it('formats datetime-local input values in the Aquarium timezone', () => {
    expect(
      formatAquariumDateTimeLocal(new Date('2026-08-10T18:00:00.000Z'), canary),
    ).toBe('2026-08-10T19:00');
  });
});
