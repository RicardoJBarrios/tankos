import { describe, expect, it } from 'vitest';
import {
  nextWeeklyOccurrence,
  resolveLocalDateTime,
} from './recurring-care-plan';
import { aquariumTimeZoneFrom } from '../../shared/domain/aquarium-reference';

const madrid = aquariumTimeZoneFrom('Europe/Madrid');

describe('Recurring Care domain', () => {
  it('resolves the first valid minute after a spring-forward gap', () => {
    const resolved = resolveLocalDateTime('2026-03-29T02:30', madrid);
    const local = new Intl.DateTimeFormat('en-GB', {
      timeZone: madrid,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(resolved);

    expect(local).toBe('03:00');
  });

  it('chooses the earlier instant for an autumn overlap', () => {
    const resolved = resolveLocalDateTime('2026-10-25T02:30', madrid);
    expect(resolved.toISOString()).toBe('2026-10-25T00:30:00.000Z');
  });

  it('advances weekly strictly after the action time', () => {
    const anchor = resolveLocalDateTime('2026-08-16T10:00', madrid);
    const next = nextWeeklyOccurrence(
      anchor,
      new Date('2026-08-16T10:00:00.000Z'),
      madrid,
    );

    expect(next.getTime()).toBeGreaterThan(
      new Date('2026-08-16T10:00:00.000Z').getTime(),
    );
    expect(
      new Intl.DateTimeFormat('en-GB', {
        timeZone: madrid,
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23',
      }).format(next),
    ).toContain('10:00');
  });
});
