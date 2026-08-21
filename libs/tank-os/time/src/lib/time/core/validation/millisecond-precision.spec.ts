import {
  truncateMilliseconds,
  truncateTimestampMilliseconds,
} from './millisecond-precision';

describe('millisecond-precision', () => {
  it.each([
    [1.999, 1],
    [-1.999, -1],
    [0, 0],
  ])(
    'Given a finite value %s, When truncating it, Then it returns %s milliseconds',
    (value, expected) => {
      expect(truncateMilliseconds(value)).toBe(expected);
    },
  );

  it.each([NaN, Infinity, -Infinity, Number.MAX_SAFE_INTEGER * 2])(
    'Given an unsafe value %s, When truncating it, Then it raises a range error',
    (value) => {
      expect(() => truncateMilliseconds(value)).toThrow(RangeError);
    },
  );

  it.each([
    [1, 999_999_999, 1_999],
    [-1, 999_999_999, 0],
  ])(
    'Given Firestore seconds %s and nanoseconds %s, When truncating them, Then it returns %s milliseconds',
    (seconds, nanoseconds, expected) => {
      expect(truncateTimestampMilliseconds(seconds, nanoseconds)).toBe(
        expected,
      );
    },
  );
});
