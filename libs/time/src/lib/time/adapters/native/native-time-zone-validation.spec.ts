import { nativeIsValidTimeZone } from './native-time-zone-validation';

describe('native-time-zone-validation', () => {
  it('Given a recognized IANA identifier, When validating it, Then it returns true', () => {
    expect(nativeIsValidTimeZone('Atlantic/Canary')).toBe(true);
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
      expect(nativeIsValidTimeZone(timeZone as never)).toBe(false);
    },
  );
});
