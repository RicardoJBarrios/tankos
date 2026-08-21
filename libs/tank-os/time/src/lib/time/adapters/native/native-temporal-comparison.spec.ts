import { createNativeTimeAdapter } from './native-time-adapter';

describe('native-temporal-comparison', () => {
  const adapter = createNativeTimeAdapter();

  it.each([
    ['instant', -1, 0, 1],
    ['duration', -1, 0, 1],
  ] as const)(
    'Given two %s values, When comparing them, Then it returns -1, 0 or 1 according to ordering',
    (kind, less, equal, greater) => {
      const compare =
        kind === 'instant' ? adapter.compareInstants : adapter.compareDurations;
      expect(compare(0, 1)).toBe(less);
      expect(compare(1, 1)).toBe(equal);
      expect(compare(1, 0)).toBe(greater);
    },
  );
});
