import { nativeCompareDurations } from './native-duration-comparison';

describe('native-duration-comparison', () => {
  it.each([
    [0, 1, -1],
    [0, 'PT1S', -1],
    [0, { kind: 'duration', milliseconds: 1_000 }, -1],
    ['PT1S', 0, 1],
    [1, 1, 0],
    ['PT1S', { kind: 'duration', milliseconds: 1_000 }, 0],
    [1, 0, 1],
    [{ kind: 'duration', milliseconds: 1_000 }, 0, 1],
  ] as const)(
    'Given durations %s and %s, When comparing them, Then it returns %s',
    (left, right, expected) => {
      expect(nativeCompareDurations(left, right)).toBe(expected);
    },
  );
});
