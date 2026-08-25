import {
  nativeFromZonedDateTime,
  nativeResolveOffsetDateTime,
  nativeResolveZonedDateTime,
} from './native-zoned-date-time-resolution';
import { nativeToUtcIsoString } from './native-instant-serialization';
import { createNativeTimeZoneDatabase } from './native-time-zone-database';

const NONEXISTENT_TIME_PATTERN = /does not exist/u;
const AMBIGUOUS_TIME_PATTERN = /ambiguous/u;
const INVALID_TIME_ZONE_PATTERN = /Invalid time zone/u;

describe('native-zoned-date-time-resolution', () => {
  const timeZoneDatabase = createNativeTimeZoneDatabase();

  it('Given a local date-time and IANA zone, When resolving it, Then it returns the corresponding instant', () => {
    expect(
      nativeToUtcIsoString(
        nativeFromZonedDateTime(
          '2026-08-20T15:30:00',
          'Atlantic/Canary',
          timeZoneDatabase,
        ),
      ),
    ).toBe('2026-08-20T14:30:00.000Z');
  });

  it('Given minute precision, When resolving it, Then seconds default to zero', () => {
    expect(
      nativeToUtcIsoString(
        nativeFromZonedDateTime('2026-08-20T15:30', 'Atlantic/Canary', timeZoneDatabase),
      ),
    ).toBe('2026-08-20T14:30:00.000Z');
  });

  it('Given milliseconds, When resolving it, Then millisecond precision is preserved', () => {
    expect(
      nativeToUtcIsoString(
        nativeFromZonedDateTime(
          '2026-08-20T15:30:01.250',
          'Atlantic/Canary',
          timeZoneDatabase,
        ),
      ),
    ).toBe('2026-08-20T14:30:01.250Z');
  });

  it('Given a local date-time and IANA zone, When resolving with origin, Then it returns the instant and the applicable source offset', () => {
    expect(
      nativeResolveZonedDateTime(
        '2026-08-20T15:30:00',
        'Atlantic/Canary',
        timeZoneDatabase,
      ),
    ).toEqual({
      instant: {
        kind: 'instant',
        epochMilliseconds: Date.parse('2026-08-20T14:30:00.000Z'),
      },
      origin: {
        sourceTimeZone: 'Atlantic/Canary',
        resolvedOffsetMinutes: 60,
      },
    });
  });

  it('Given a local date-time and explicit offset, When resolving with origin, Then it retains the source offset', () => {
    expect(nativeResolveOffsetDateTime('2026-08-20T15:30:00', 60)).toEqual({
      instant: {
        kind: 'instant',
        epochMilliseconds: Date.parse('2026-08-20T14:30:00.000Z'),
      },
      origin: {
        sourceOffsetMinutes: 60,
        resolvedOffsetMinutes: 60,
      },
    });
  });

  it('Given an invalid explicit offset, When resolving it, Then it raises a range error', () => {
    expect(() =>
      nativeResolveOffsetDateTime('2026-08-20T15:30:00', 1.5),
    ).toThrow(RangeError);
  });

  it('Given a nonexistent DST local time, When resolving it, Then it raises a range error', () => {
    expect(() =>
      nativeFromZonedDateTime(
        '2026-03-08T02:30:00',
        'America/New_York',
        timeZoneDatabase,
      ),
    ).toThrow(NONEXISTENT_TIME_PATTERN);
  });

  it('Given an ambiguous DST local time, When resolving it, Then it raises a range error', () => {
    expect(() =>
      nativeFromZonedDateTime(
        '2026-11-01T01:30:00',
        'America/New_York',
        timeZoneDatabase,
      ),
    ).toThrow(AMBIGUOUS_TIME_PATTERN);
  });

  it('Given an invalid local clock value, When resolving it, Then it raises a range error', () => {
    expect(() =>
      nativeFromZonedDateTime('2026-08-20T24:00:00', 'UTC', timeZoneDatabase),
    ).toThrow(RangeError);
  });

  it('Given an invalid zone, When resolving a local date-time, Then it raises a range error', () => {
    expect(() =>
      nativeFromZonedDateTime(
        '2026-08-20T15:30:00',
        'Not/A_Time_Zone',
        timeZoneDatabase,
      ),
    ).toThrow(INVALID_TIME_ZONE_PATTERN);
  });
});
