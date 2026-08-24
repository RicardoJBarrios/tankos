import { createNativeTimeAdapter } from './native-time-adapter';

describe('native-duration-between', () => {
  const adapter = createNativeTimeAdapter();

  it.each([
    [0, 1_000],
    [0, '1970-01-01T00:00:01Z'],
    [0, { kind: 'instant', epochMilliseconds: 1_000 }],
    ['1970-01-01T00:00:00Z', 1_000],
    ['1970-01-01T00:00:00Z', '1970-01-01T00:00:01Z'],
    ['1970-01-01T00:00:00Z', { kind: 'instant', epochMilliseconds: 1_000 }],
    [{ kind: 'instant', epochMilliseconds: 0 }, 1_000],
    [{ kind: 'instant', epochMilliseconds: 0 }, '1970-01-01T00:00:01Z'],
    [
      { kind: 'instant', epochMilliseconds: 0 },
      { kind: 'instant', epochMilliseconds: 1_000 },
    ],
  ] as const)(
    'Given instants in any supported representation %s and %s, When calculating their duration, Then it returns end minus start in milliseconds',
    (start, end) => {
      expect(adapter.durationBetween(start, end)).toEqual({
        kind: 'duration',
        milliseconds: 1_000,
      });
    },
  );

  it('Given equal instants, When calculating duration, Then it returns zero', () => {
    expect(adapter.durationBetween('1970-01-01T00:00:01Z', 1_000)).toEqual({
      kind: 'duration',
      milliseconds: 0,
    });
  });

  it('Given a reverse range, When calculating duration, Then it returns a negative duration', () => {
    expect(adapter.durationBetween(1_000, 0)).toEqual({
      kind: 'duration',
      milliseconds: -1_000,
    });
  });
});
