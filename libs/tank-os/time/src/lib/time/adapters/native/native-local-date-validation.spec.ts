import { createNativeTimeAdapter } from './native-time-adapter';

describe('native-local-date-validation', () => {
  const adapter = createNativeTimeAdapter();

  it('Given a valid calendar date, When validating it, Then it returns true', () => {
    expect(adapter.isValidLocalDate('2026-08-20')).toBe(true);
  });

  it('Given a valid structured local date, When validating it, Then it returns true', () => {
    expect(
      adapter.isValidLocalDate({
        kind: 'local-date',
        year: 2026,
        month: 8,
        day: 20,
      }),
    ).toBe(true);
  });

  it.each([
    '2026-02-29',
    'not-a-date',
    '',
    ' 2026-08-20',
    '2026-08-20 ',
    '2026/08/20',
    '2026-08-20✨',
    20260820,
    null,
    undefined,
    { kind: 'local-date', year: 2026, month: 2, day: 29 },
    { kind: 'local-date', year: Number.NaN, month: 8, day: 20 },
    { kind: 'local-date', year: Number.POSITIVE_INFINITY, month: 8, day: 20 },
    { kind: 'local-date', year: Number.NEGATIVE_INFINITY, month: 8, day: 20 },
    { kind: 'other', year: 2026, month: 8, day: 20 },
  ])(
    'Given invalid value %s, When validating it, Then it returns false',
    (value) => {
      expect(adapter.isValidLocalDate(value)).toBe(false);
    },
  );
});
