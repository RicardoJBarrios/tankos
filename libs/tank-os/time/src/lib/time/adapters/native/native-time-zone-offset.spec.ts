import {
  getCandidateOffsets,
  getTimeZoneOffset,
} from './native-time-zone-offset';

describe('native-time-zone-offset', () => {
  it('Given a UTC timestamp, When calculating offsets, Then UTC has zero offset', () => {
    const timestamp = Date.parse('2026-08-20T15:30:01Z');
    expect(getTimeZoneOffset(timestamp, 'UTC')).toBe(0);
    expect(getCandidateOffsets(timestamp, 'UTC')).toContain(0);
  });
});
