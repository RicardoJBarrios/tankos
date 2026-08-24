import { createNativeTimeAdapter } from './native-time-adapter';

describe('native-time-zone-validation', () => {
  const adapter = createNativeTimeAdapter();

  it('Given a recognized IANA identifier, When validating it, Then it returns true', () => {
    expect(adapter.isValidTimeZone('Atlantic/Canary')).toBe(true);
  });

  it.each([
    'Not/A_Time_Zone',
    '',
    '   ',
    ' UTC',
    'UTC ',
    'Europe/Pa✨ris',
    'Europe/Paris\n',
    null,
    undefined,
  ])(
    'Given invalid zone %s, When validating it, Then it returns false',
    (timeZone) => {
      expect(adapter.isValidTimeZone(timeZone as never)).toBe(false);
    },
  );
});
