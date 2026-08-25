import { nativeAddLocalDate } from './native-local-date-arithmetic';

describe('native-local-date-arithmetic', () => {
  it.each([
    ['2024-01-31', { months: 1 }, '2024-02-29'],
    ['2023-01-31', { months: 1 }, '2023-02-28'],
    ['1900-01-31', { months: 1 }, '1900-02-28'],
    ['2000-01-31', { months: 1 }, '2000-02-29'],
    ['2024-02-29', { years: 1 }, '2025-02-28'],
    ['2026-03-31', { months: 1 }, '2026-04-30'],
    ['2026-08-20', { days: -21 }, '2026-07-30'],
    ['2026-08-20', {}, '2026-08-20'],
    ['2026-08-20', { years: 1, months: 2, days: 3 }, '2027-10-23'],
    ['2026-08-20', { years: -1, months: -2, days: -3 }, '2025-06-17'],
  ] as const)(
    'Given date %s and period %s, When adding the period, Then it returns %s',
    (value, period, expected) => {
      expect(nativeAddLocalDate(value, period)).toEqual({
        kind: 'local-date',
        year: Number(expected.slice(0, 4)),
        month: Number(expected.slice(5, 7)),
        day: Number(expected.slice(8, 10)),
      });
    },
  );

  it.each([{ years: 1.5 }, { months: Number.NaN }, { days: Infinity }, null])(
    'Given invalid calendar period %s, When adding it, Then it rejects the period',
    (period) => {
      expect(() => nativeAddLocalDate('2026-08-20', period as never)).toThrow(
        RangeError,
      );
    },
  );
});
