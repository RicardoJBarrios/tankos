import {
  nativeClamp,
  nativeContains,
  nativeCreateInterval,
} from './native-time-interval';

describe('native-time-interval', () => {
  it('Given ordered boundaries, When creating an interval, Then it normalizes both boundaries', () => {
    expect(nativeCreateInterval('1970-01-01T00:00:00Z', 1_000)).toEqual({
      start: { kind: 'instant', epochMilliseconds: 0 },
      end: { kind: 'instant', epochMilliseconds: 1_000 },
    });
  });

  it('Given inverted boundaries, When creating an interval, Then it rejects the range', () => {
    expect(() => nativeCreateInterval(1_000, 0)).toThrow(RangeError);
  });

  it.each([0, 500, 1_000])(
    'Given an inclusive boundary value %s, When checking membership, Then it is contained',
    (value) => {
      const interval = nativeCreateInterval(0, 1_000);
      expect(nativeContains(interval, value)).toBe(true);
    },
  );

  it('Given a value outside an interval, When checking membership, Then it is not contained', () => {
    const interval = nativeCreateInterval(0, 1_000);
    expect(nativeContains(interval, -1)).toBe(false);
    expect(nativeContains(interval, 1_001)).toBe(false);
  });

  it.each([
    ['1970-01-01T00:00:00Z', 500],
    [0, '1970-01-01T00:00:00.500Z'],
    [
      { kind: 'instant', epochMilliseconds: 0 },
      { kind: 'instant', epochMilliseconds: 500 },
    ],
  ] as const)(
    'Given an interval query in supported representations %s and %s, When checking membership, Then it normalizes both values',
    (start, value) => {
      const interval = nativeCreateInterval(start, 1_000);
      expect(nativeContains(interval, value)).toBe(true);
    },
  );

  it.each([
    null,
    {},
    { start: 1_000, end: 0 },
    { start: 'invalid', end: 1_000 },
  ])(
    'Given an invalid interval %s, When querying membership, Then it rejects the interval',
    (interval) => {
      expect(() => nativeContains(interval as never, 500)).toThrow(
        RangeError,
      );
    },
  );

  it.each([
    [-1, 0],
    [500, 500],
    [1_001, 1_000],
  ] as const)(
    'Given value %s, When clamping it, Then it returns %s',
    (value, expected) => {
      expect(nativeClamp(value, nativeCreateInterval(0, 1_000))).toEqual({
        kind: 'instant',
        epochMilliseconds: expected,
      });
    },
  );

  it('Given an interval with non-normalized boundaries, When clamping a value, Then it normalizes the boundaries', () => {
    expect(
      nativeClamp(2_000, {
        start: '1970-01-01T00:00:00Z',
        end: 1_000,
      }),
    ).toEqual({ kind: 'instant', epochMilliseconds: 1_000 });
  });

  it('Given an invalid interval, When clamping a value, Then it rejects the interval', () => {
    expect(() => nativeClamp(500, { start: 1_000, end: 0 } as never)).toThrow(
      RangeError,
    );
  });
});
