import { getLocalParts, sameDateTime } from './native-time-zone-local-parts';

describe('native-time-zone-local-parts', () => {
  it('Given a UTC timestamp, When reading its local parts, Then it returns the expected fields', () => {
    expect(getLocalParts(Date.parse('2026-08-20T15:30:01Z'), 'UTC')).toEqual({
      year: 2026,
      month: 8,
      day: 20,
      hour: 15,
      minute: 30,
      second: 1,
      millisecond: 0,
    });
  });

  it('Given equal or different date-time fields, When comparing them, Then it reports equality accurately', () => {
    const fields = getLocalParts(Date.parse('2026-08-20T15:30:01Z'), 'UTC');
    expect(sameDateTime(fields, { ...fields })).toBe(true);
    expect(sameDateTime(fields, { ...fields, second: 2 })).toBe(false);
  });
});
