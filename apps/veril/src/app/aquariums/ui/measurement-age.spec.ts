import { describe, expect, it } from 'vitest';
import { measurementAgeFor } from './measurement-age';

const now = new Date('2026-08-10T12:00:00.000Z');

describe('measurementAgeFor', () => {
  it.each([
    [0, 'Ahora'],
    [45, 'Ahora'],
    [60, 'Hace 1 minuto'],
    [120, 'Hace 2 minutos'],
    [3_600, 'Hace 1 hora'],
    [7_200, 'Hace 2 horas'],
    [86_400, 'Hace 1 día'],
    [432_000, 'Hace 5 días'],
  ])('formats %s elapsed seconds as %s', (seconds, text) => {
    const measuredAt = new Date(now.getTime() - seconds * 1_000);

    expect(measurementAgeFor(measuredAt, now).text).toBe(text);
  });

  it('handles a future timestamp explicitly', () => {
    const measuredAt = new Date(now.getTime() + 60_000);

    expect(measurementAgeFor(measuredAt, now).text).toBe('Fecha futura');
  });

  it('rejects invalid timestamps', () => {
    expect(() => measurementAgeFor(new Date('invalid'), now)).toThrow(
      'timestamps must be valid dates',
    );
  });
});
