import { nativeDurationBetweenLocalDates } from './native-local-date-difference';

describe('native-local-date-difference', () => {
  it('Given two local dates, When calculating their difference, Then it returns whole calendar days as milliseconds', () => {
    expect(
      nativeDurationBetweenLocalDates('2026-08-20', '2026-08-23'),
    ).toEqual({ kind: 'duration', milliseconds: 259_200_000 });
  });

  it.each([
    ['2026-08-20', { kind: 'local-date', year: 2026, month: 8, day: 23 }],
    [{ kind: 'local-date', year: 2026, month: 8, day: 20 }, '2026-08-23'],
    [
      { kind: 'local-date', year: 2026, month: 8, day: 20 },
      { kind: 'local-date', year: 2026, month: 8, day: 23 },
    ],
  ] as const)(
    'Given local dates in supported representations %s and %s, When calculating their difference, Then it returns whole calendar days',
    (start, end) => {
      expect(nativeDurationBetweenLocalDates(start, end)).toEqual({
        kind: 'duration',
        milliseconds: 259_200_000,
      });
    },
  );

  it('Given a reverse local-date range, When calculating its difference, Then it returns a negative duration', () => {
    expect(
      nativeDurationBetweenLocalDates('2026-08-23', '2026-08-20'),
    ).toEqual({ kind: 'duration', milliseconds: -259_200_000 });
  });
});
