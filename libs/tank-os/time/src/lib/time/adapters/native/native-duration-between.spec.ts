import { createNativeTimeAdapter } from './native-time-adapter';

describe('native-duration-between', () => {
  const adapter = createNativeTimeAdapter();

  it('Given two instants, When calculating their duration, Then it returns end minus start in milliseconds', () => {
    expect(
      adapter.durationBetween('2026-08-20T10:00:00Z', '2026-08-20T11:30:00Z'),
    ).toEqual({ kind: 'duration', milliseconds: 5_400_000 });
  });

  it('Given a reverse range, When calculating duration, Then it returns a negative duration', () => {
    expect(adapter.durationBetween(1_000, 0)).toEqual({
      kind: 'duration',
      milliseconds: -1_000,
    });
  });
});
