import { isValidCalendarDate } from './calendar-date-validation';

describe('calendar-date-validation', () => {
  it.each([
    [2024, 2, 29],
    [2026, 8, 20],
    [1, 1, 1],
    [2000, 2, 29],
  ])(
    'Given %s-%s-%s, When validating it, Then it is accepted',
    (year, month, day) => {
      expect(isValidCalendarDate(year, month, day)).toBe(true);
    },
  );

  it.each([
    [2023, 2, 29],
    [1900, 2, 29],
    [2026, 4, 31],
    [2026, 0, 10],
    [2026, 13, 10],
    [2026, 8, 0],
    [2026, 8, 32],
    [Number.NaN, 8, 20],
    [Number.POSITIVE_INFINITY, 8, 20],
    [2026.5, 8, 20],
    [-1, 8, 20],
    [10000, 1, 1],
  ])(
    'Given %s-%s-%s, When validating it, Then it is rejected',
    (year, month, day) => {
      expect(isValidCalendarDate(year, month, day)).toBe(false);
    },
  );
});
