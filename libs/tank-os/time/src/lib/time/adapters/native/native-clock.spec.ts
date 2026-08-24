import { createNativeClock } from './native-clock';

describe('native-clock', () => {
  it('Given a native clock, When reading now, Then it returns a valid current instant', () => {
    const clock = createNativeClock();
    const before = Date.now();

    const value = clock.now();

    const after = Date.now();
    expect(value.kind).toBe('instant');
    expect(value.epochMilliseconds).toBeGreaterThanOrEqual(before);
    expect(value.epochMilliseconds).toBeLessThanOrEqual(after);
  });
});
