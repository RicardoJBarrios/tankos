import { nativeToUtcIsoString } from './native-instant-serialization';

describe('native-instant-serialization', () => {
  it('Given an instant with an offset, When serializing it, Then it returns UTC ISO notation', () => {
    expect(nativeToUtcIsoString('2026-08-20T15:30:00+01:00')).toBe(
      '2026-08-20T14:30:00.000Z',
    );
  });

  it.each([0, -1, { kind: 'instant', epochMilliseconds: 0 }] as const)(
    'Given supported value %s, When serializing it, Then it returns UTC ISO notation',
    (value) => {
      expect(nativeToUtcIsoString(value)).toMatch(/Z$/);
    },
  );

  it.each([
    'not-an-instant',
    '',
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
    null,
    undefined,
  ])(
    'Given invalid value %s, When serializing it, Then it raises an error',
    (value) => {
      expect(() => nativeToUtcIsoString(value as never)).toThrow();
    },
  );
});
