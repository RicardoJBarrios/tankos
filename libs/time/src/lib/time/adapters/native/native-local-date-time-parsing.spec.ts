import { parseLocalDateTime } from './native-local-date-time-parsing';

describe('native-local-date-time-parsing', () => {
  it('Given a local date-time with milliseconds, When parsing it, Then it returns all clock fields', () => {
    expect(parseLocalDateTime('2026-08-20T15:30:01.250')).toEqual({
      year: 2026,
      month: 8,
      day: 20,
      hour: 15,
      minute: 30,
      second: 1,
      millisecond: 250,
    });
  });

  it('Given minute precision, When parsing it, Then seconds and milliseconds default to zero', () => {
    expect(parseLocalDateTime('2026-08-20T15:30')).toEqual({
      year: 2026,
      month: 8,
      day: 20,
      hour: 15,
      minute: 30,
      second: 0,
      millisecond: 0,
    });
  });

  it.each([
    'not-a-date-time',
    '',
    ' 2026-08-20T15:30',
    '2026-08-20T15:30 ',
    '2026/08/20T15:30',
    '2026-08-20T15:30✨',
    '2026-02-29T15:30:00',
    '2026-08-20T24:00:00',
    '2026-08-20T15:60:00',
    '2026-08-20T15:30:60',
    null,
    undefined,
  ])(
    'Given malformed value %s, When parsing it, Then it raises a range error',
    (value) => {
      expect(() => parseLocalDateTime(value)).toThrow(RangeError);
    },
  );
});
