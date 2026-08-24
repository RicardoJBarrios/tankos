import { createUtcTimestamp } from './native-calendar-date';

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
});
