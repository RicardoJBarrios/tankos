import { createNativeTimeAdapter } from './native-time-adapter';

describe('native-time-interval', () => {
  const adapter = createNativeTimeAdapter();

  it('Given ordered boundaries, When creating an interval, Then it normalizes both boundaries', () => {
    expect(adapter.createInterval('1970-01-01T00:00:00Z', 1_000)).toEqual({
      start: { kind: 'instant', epochMilliseconds: 0 },
      end: { kind: 'instant', epochMilliseconds: 1_000 },
    });
  });

  it('Given inverted boundaries, When creating an interval, Then it rejects the range', () => {
    expect(() => adapter.createInterval(1_000, 0)).toThrow(RangeError);
  });

  it.each([0, 500, 1_000])(
    'Given an inclusive boundary value %s, When checking membership, Then it is contained',
    (value) => {
      const interval = adapter.createInterval(0, 1_000);
      expect(adapter.contains(interval, value)).toBe(true);
    },
  );

  it('Given a value outside an interval, When checking membership, Then it is not contained', () => {
    const interval = adapter.createInterval(0, 1_000);
    expect(adapter.contains(interval, -1)).toBe(false);
    expect(adapter.contains(interval, 1_001)).toBe(false);
  });

  it.each([
    [-1, 0],
    [500, 500],
    [1_001, 1_000],
  ] as const)(
    'Given value %s, When clamping it, Then it returns %s',
    (value, expected) => {
      expect(adapter.clamp(value, adapter.createInterval(0, 1_000))).toEqual({
        kind: 'instant',
        epochMilliseconds: expected,
      });
    },
  );
});
