import {
  FORMATTER_CACHE_LIMIT,
  getFormatter,
} from './native-time-zone-formatter';

describe('native-time-zone-formatter', () => {
  it('Given a time zone, When requesting its formatter twice, Then the cached formatter is reused', () => {
    expect(getFormatter('UTC')).toBe(getFormatter('UTC'));
  });

  it('Given more zones than the cache limit, When requesting another formatter, Then the oldest formatter is evicted', () => {
    const zones = Intl.supportedValuesOf('timeZone').slice(
      0,
      FORMATTER_CACHE_LIMIT + 1,
    );
    const firstFormatter = getFormatter(zones[0]);
    for (const zone of zones.slice(1)) getFormatter(zone);
    expect(getFormatter(zones[0])).not.toBe(firstFormatter);
  });
});
