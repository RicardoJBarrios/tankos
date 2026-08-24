import { createNativeTimeAdapter } from './native-time-adapter';

describe('native-instant-validation', () => {
  const adapter = createNativeTimeAdapter();

  it('Given a valid ISO instant, When validating it, Then it returns true', () => {
    expect(adapter.isValidInstant('2026-08-20T15:30:00Z')).toBe(true);
  });

  it('Given a local date-time, When validating it, Then it returns false', () => {
    expect(adapter.isValidInstant('2026-08-20T15:30:00')).toBe(false);
  });

  it.each([
    '',
    ' 2026-08-20T15:30:00Z',
    '2026-08-20T15:30:00Z ',
    '2026/08/20T15:30:00Z',
    '2026-08-20T15:30:00Z✨',
    {},
    null,
    undefined,
    Number.NaN,
    Number.POSITIVE_INFINITY,
    Number.NEGATIVE_INFINITY,
  ])(
    'Given unsupported value %s, When validating it, Then it returns false without throwing',
    (value) => {
      expect(adapter.isValidInstant(value)).toBe(false);
    },
  );

  it.each([-1, { kind: 'instant', epochMilliseconds: 0 }])(
    'Given supported value %s, When validating it, Then it returns true',
    (value) => {
      expect(adapter.isValidInstant(value)).toBe(true);
    },
  );

  it('Given fractional epoch milliseconds, When validating it, Then it returns true because it is truncatable', () => {
    expect(adapter.isValidInstant(1.5)).toBe(true);
  });
});
