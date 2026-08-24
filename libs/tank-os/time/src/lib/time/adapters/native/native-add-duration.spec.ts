import { createNativeTimeAdapter } from './native-time-adapter';

describe('native-add-duration', () => {
  const adapter = createNativeTimeAdapter();

  it.each([
    [0, 1_500, 1_500],
    [0, 'PT1.5S', 1_500],
    [0, { kind: 'duration', milliseconds: 1_500 }, 1_500],
    ['1970-01-01T00:00:02Z', -1_000, 1_000],
    ['1970-01-01T00:00:02Z', 'PT1S', 3_000],
    ['1970-01-01T00:00:02Z', { kind: 'duration', milliseconds: 1_500 }, 3_500],
    [{ kind: 'instant', epochMilliseconds: 1_000 }, -1_000, 0],
    [{ kind: 'instant', epochMilliseconds: 1_000 }, 'PT1.5S', 2_500],
    [
      { kind: 'instant', epochMilliseconds: 1_000 },
      { kind: 'duration', milliseconds: 1_500 },
      2_500,
    ],
  ] as const)(
    'Given start %s and duration %s, When adding them, Then it returns instant %s',
    (start, duration, epochMilliseconds) => {
      expect(adapter.addDuration(start, duration)).toEqual({
        kind: 'instant',
        epochMilliseconds,
      });
    },
  );
});
