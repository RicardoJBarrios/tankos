import {
  FORMATTER_CACHE_LIMIT,
  getCandidateOffsets,
  getFormatter,
  getLocalParts,
  getTimeZoneOffset,
  sameDateTime,
} from './native-time-zone-runtime';

describe('native-time-zone-runtime', () => {
  it('Given a time zone, When requesting its formatter twice, Then the cached formatter is reused', () => {
    expect(getFormatter('UTC')).toBe(getFormatter('UTC'));
  });

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

  it('Given a UTC timestamp, When calculating offsets, Then UTC has zero offset', () => {
    const timestamp = Date.parse('2026-08-20T15:30:01Z');

    expect(getTimeZoneOffset(timestamp, 'UTC')).toBe(0);
    expect(getCandidateOffsets(timestamp, 'UTC')).toContain(0);
  });

  it('Given more zones than the cache limit, When requesting another formatter, Then the oldest formatter is evicted', () => {
    const zones = Intl.supportedValuesOf('timeZone').slice(
      0,
      FORMATTER_CACHE_LIMIT + 1,
    );
    const firstFormatter = getFormatter(zones[0]);

    for (const zone of zones.slice(1)) {
      getFormatter(zone);
    }

    expect(getFormatter(zones[0])).not.toBe(firstFormatter);
  });
});
