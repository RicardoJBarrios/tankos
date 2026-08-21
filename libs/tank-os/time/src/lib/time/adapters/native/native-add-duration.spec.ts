import { createNativeTimeAdapter } from './native-time-adapter';

describe('native-add-duration', () => {
  const adapter = createNativeTimeAdapter();

  it.each([
    [0, 1_500, 1_500],
    ['1970-01-01T00:00:02Z', -1_000, 1_000],
    [{ kind: 'instant', epochMilliseconds: 1_000 }, 'PT1.5S', 2_500],
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
