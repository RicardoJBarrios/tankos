import { toDatePipeTimeZone } from './angular-time-zone-offset';

describe('angular-time-zone-offset', () => {
  it.each([
    ['UTC', '+0000'],
    ['Z', '+0000'],
    ['+01:30', '+0130'],
    ['-0430', '-0430'],
  ])(
    'Given a direct timezone value %s, When converting it for DatePipe, Then it returns %s',
    (timeZone, expected) => {
      expect(toDatePipeTimeZone(timeZone, 0)).toBe(expected);
    },
  );

  it('Given an IANA timezone during daylight saving time, When converting it for DatePipe, Then it returns the offset at that instant', () => {
    expect(
      toDatePipeTimeZone(
        'Europe/Madrid',
        Date.parse('2026-08-20T12:00:00.000Z'),
      ),
    ).toBe('+0200');
  });

  it('Given an IANA timezone during standard time, When converting it for DatePipe, Then it returns the standard offset', () => {
    expect(
      toDatePipeTimeZone(
        'Europe/Madrid',
        Date.parse('2026-01-20T12:00:00.000Z'),
      ),
    ).toBe('+0100');
  });

  it('Given an IANA timezone west of UTC, When converting it for DatePipe, Then it returns a negative offset', () => {
    expect(
      toDatePipeTimeZone(
        'America/New_York',
        Date.parse('2026-01-20T12:00:00.000Z'),
      ),
    ).toBe('-0500');
  });

  it('Given an unknown timezone, When converting it for DatePipe, Then it raises a range error', () => {
    expect(() => toDatePipeTimeZone('Not/A_Time_Zone', 0)).toThrow(RangeError);
  });

  it.each(['+24:00', '-01:60'])(
    'Given an invalid fixed offset %s, When converting it, Then it raises a range error',
    (timeZone) => {
      expect(() => toDatePipeTimeZone(timeZone, 0)).toThrow(RangeError);
    },
  );
});
