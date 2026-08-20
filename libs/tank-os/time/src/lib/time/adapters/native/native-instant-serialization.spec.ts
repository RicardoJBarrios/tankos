import { createNativeTimeAdapter } from './native-time-adapter';

describe('native-instant-serialization', () => {
  const adapter = createNativeTimeAdapter();

  it('Given an instant with an offset, When serializing it, Then it returns UTC ISO notation', () => {
    expect(adapter.toUtcIsoString('2026-08-20T15:30:00+01:00')).toBe(
      '2026-08-20T14:30:00.000Z',
    );
  });

  it.each([0, -1, { kind: 'instant', epochMilliseconds: 0 }] as const)(
    'Given supported value %s, When serializing it, Then it returns UTC ISO notation',
    (value) => {
      expect(adapter.toUtcIsoString(value)).toMatch(/Z$/);
    },
  );

  it.each([
    'not-an-instant',
    '',
    Number.NaN,
    Number.POSITIVE_INFINITY,
    null,
    undefined,
  ])(
    'Given invalid value %s, When serializing it, Then it raises an error',
    (value) => {
      expect(() => adapter.toUtcIsoString(value as never)).toThrow();
    },
  );
});
