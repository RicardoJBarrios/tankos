import { createNativeTimeAdapter } from './native-time-adapter';

describe('native-duration-comparison', () => {
  const adapter = createNativeTimeAdapter();

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
      expect(adapter.compareDurations(left, right)).toBe(expected);
    },
  );
});
