import { createNativeTimeAdapter } from './native-time-adapter';

describe('native-local-date-difference', () => {
  const adapter = createNativeTimeAdapter();

  it('Given two local dates, When calculating their difference, Then it returns whole calendar days as milliseconds', () => {
    expect(
      adapter.durationBetweenLocalDates('2026-08-20', '2026-08-23'),
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
      expect(adapter.durationBetweenLocalDates(start, end)).toEqual({
        kind: 'duration',
        milliseconds: 259_200_000,
      });
    },
  );

  it('Given a reverse local-date range, When calculating its difference, Then it returns a negative duration', () => {
    expect(
      adapter.durationBetweenLocalDates('2026-08-23', '2026-08-20'),
    ).toEqual({ kind: 'duration', milliseconds: -259_200_000 });
  });
});
