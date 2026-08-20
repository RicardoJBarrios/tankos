import {
  createUtcTimestamp,
  isValidCalendarDate,
} from './native-calendar-date';

describe('native calendar date', () => {
  describe('createUtcTimestamp', () => {
    it('Given complete UTC fields, When creating a timestamp, Then it preserves every field', () => {
      const timestamp = createUtcTimestamp({
        year: 2026,
        month: 8,
        day: 20,
        hour: 15,
        minute: 30,
        second: 1,
        millisecond: 250,
      });

      expect(new Date(timestamp).toISOString()).toBe(
        '2026-08-20T15:30:01.250Z',
      );
    });
  });

  describe('isValidCalendarDate', () => {
    it.each([
      [2024, 2, 29],
      [2026, 8, 20],
      [1, 1, 1],
    ])(
      'Given %s-%s-%s, When validating it, Then it is accepted',
      (year, month, day) => {
        expect(isValidCalendarDate(year, month, day)).toBe(true);
      },
    );

    it.each([
      [2023, 2, 29],
      [2026, 4, 31],
      [2026, 0, 10],
      [2026, 13, 10],
      [2026, 8, 0],
      [2026, 8, 32],
      [Number.NaN, 8, 20],
      [Number.POSITIVE_INFINITY, 8, 20],
      [2026.5, 8, 20],
      [-1, 8, 20],
    ])(
      'Given %s-%s-%s, When validating it, Then it is rejected',
      (year, month, day) => {
        expect(isValidCalendarDate(year, month, day)).toBe(false);
      },
    );
  });
});
