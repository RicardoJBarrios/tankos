import { nativeParseDuration } from './native-duration-parsing';

describe('native-duration-parsing', () => {
  it.each([
    [0, 0],
    [-1500, -1500],
    ['P1D', 86_400_000],
    ['PT1H30M', 5_400_000],
    ['-PT0.001S', -1],
    [{ kind: 'duration', milliseconds: 2_000 }, 2_000],
  ])(
    'Given a supported duration %s, When parsing it, Then it returns %s milliseconds',
    (value, milliseconds) => {
      expect(nativeParseDuration(value as never)).toEqual({
        kind: 'duration',
        milliseconds,
      });
    },
  );

  it.each([
    NaN,
    Infinity,
    1.5,
    '',
    'P',
    'PT',
    'P1DT',
    'P1M',
    'P1Y',
    'P1W',
    'PT1.0001S',
    { kind: 'duration', milliseconds: 1.5 },
    { kind: 'instant', epochMilliseconds: 1 },
  ])(
    'Given an unsupported duration %s, When parsing it, Then it raises a range error',
    (value) => {
      expect(() => nativeParseDuration(value as never)).toThrow(RangeError);
    },
  );
});
