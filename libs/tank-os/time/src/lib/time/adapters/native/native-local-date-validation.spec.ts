import { createNativeTimeAdapter } from './native-time-adapter';

describe('native-local-date-validation', () => {
  const adapter = createNativeTimeAdapter();

  it('Given a valid calendar date, When validating it, Then it returns true', () => {
    expect(adapter.isValidLocalDate('2026-08-20')).toBe(true);
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
  ])(
    'Given invalid value %s, When validating it, Then it returns false',
    (value) => {
      expect(adapter.isValidLocalDate(value)).toBe(false);
    },
  );
});
