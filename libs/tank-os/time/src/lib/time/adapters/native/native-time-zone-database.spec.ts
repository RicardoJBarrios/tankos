import { createNativeTimeZoneDatabase } from './native-time-zone-database';

describe('native-time-zone-database', () => {
  const database = createNativeTimeZoneDatabase();

  it('Given an IANA zone, When validating it, Then it delegates to Intl TZDB recognition', () => {
    expect(database.isValid('Atlantic/Canary')).toBe(true);
    expect(database.isValid('Not/A_Time_Zone')).toBe(false);
  });

  it('Given an instant and UTC, When reading the offset, Then it returns zero minutes', () => {
    expect(
      database.getOffsetMinutes(
        { kind: 'instant', epochMilliseconds: 0 },
        'UTC',
      ),
    ).toBe(0);
  });

  it('Given an invalid zone, When reading the offset, Then it raises a range error', () => {
    expect(() =>
      database.getOffsetMinutes(
        { kind: 'instant', epochMilliseconds: 0 },
        'Not/A_Time_Zone',
      ),
    ).toThrow(RangeError);
  });
});
