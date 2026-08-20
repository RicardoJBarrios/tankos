import { createNativeTimeAdapter } from './native-time-adapter';

describe('native-zoned-date-time-resolution', () => {
  const adapter = createNativeTimeAdapter();

  it('Given a local date-time and IANA zone, When resolving it, Then it returns the corresponding instant', () => {
    expect(
      adapter.toUtcIsoString(
        adapter.fromZonedDateTime('2026-08-20T15:30:00', 'Atlantic/Canary'),
      ),
    ).toBe('2026-08-20T14:30:00.000Z');
  });

  it('Given minute precision, When resolving it, Then seconds default to zero', () => {
    expect(
      adapter.toUtcIsoString(
        adapter.fromZonedDateTime('2026-08-20T15:30', 'Atlantic/Canary'),
      ),
    ).toBe('2026-08-20T14:30:00.000Z');
  });

  it('Given milliseconds, When resolving it, Then millisecond precision is preserved', () => {
    expect(
      adapter.toUtcIsoString(
        adapter.fromZonedDateTime('2026-08-20T15:30:01.250', 'Atlantic/Canary'),
      ),
    ).toBe('2026-08-20T14:30:01.250Z');
  });

  it('Given a nonexistent DST local time, When resolving it, Then it raises a range error', () => {
    expect(() =>
      adapter.fromZonedDateTime('2026-03-08T02:30:00', 'America/New_York'),
    ).toThrow(/does not exist/);
  });

  it('Given an ambiguous DST local time, When resolving it, Then it raises a range error', () => {
    expect(() =>
      adapter.fromZonedDateTime('2026-11-01T01:30:00', 'America/New_York'),
    ).toThrow(/ambiguous/);
  });

  it('Given an invalid local clock value, When resolving it, Then it raises a range error', () => {
    expect(() =>
      adapter.fromZonedDateTime('2026-08-20T24:00:00', 'UTC'),
    ).toThrow(RangeError);
  });

  it('Given an invalid zone, When resolving a local date-time, Then it raises a range error', () => {
    expect(() =>
      adapter.fromZonedDateTime('2026-08-20T15:30:00', 'Not/A_Time_Zone'),
    ).toThrow(/Invalid time zone/);
  });
});
