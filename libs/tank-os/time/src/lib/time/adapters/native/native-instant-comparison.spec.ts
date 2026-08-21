import { createNativeTimeAdapter } from './native-time-adapter';

describe('native-instant-comparison', () => {
  const adapter = createNativeTimeAdapter();

  it.each([
    [0, 1, -1],
    [1, 1, 0],
    [1, 0, 1],
  ] as const)(
    'Given instants %s and %s, When comparing them, Then it returns %s',
    (left, right, expected) => {
      expect(adapter.compareInstants(left, right)).toBe(expected);
    },
  );
});
