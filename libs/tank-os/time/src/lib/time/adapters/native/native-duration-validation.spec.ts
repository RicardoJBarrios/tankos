import { nativeIsValidDuration } from './native-duration-validation';

describe('native-duration-validation', () => {
  it.each([0, -1, 'PT1S', 'P1D', { kind: 'duration', milliseconds: 1 }])(
    'Given a valid duration input %s, When validating it, Then it returns true',
    (value) => {
      expect(nativeIsValidDuration(value)).toBe(true);
    },
  );

  it.each([
    null,
    undefined,
    NaN,
    Infinity,
    1.1,
    '',
    'PT',
    'P1DT',
    'P1M',
    'PT1.0001S',
    { kind: 'duration', milliseconds: 1.1 },
  ])(
    'Given an invalid duration input %s, When validating it, Then it returns false',
    (value) => {
      expect(nativeIsValidDuration(value)).toBe(false);
    },
  );
});
