import { nativeToDurationIsoString } from './native-duration-serialization';

describe('native-duration-serialization', () => {
  it.each([
    [0, 'PT0S'],
    [86_400_000, 'P1D'],
    [90_061_001, 'P1DT1H1M1.001S'],
    [3_600_000, 'PT1H'],
    [-1500, '-PT1.5S'],
    ['PT1M', 'PT1M'],
    [{ kind: 'duration', milliseconds: 60_000 }, 'PT1M'],
  ])(
    'Given a duration %s, When serializing it, Then it returns %s',
    (value, expected) => {
      expect(nativeToDurationIsoString(value as never)).toBe(expected);
    },
  );
});
