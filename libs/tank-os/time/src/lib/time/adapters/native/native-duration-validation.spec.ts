import { nativeIsValidDuration } from './native-duration-validation';

describe('native-duration-validation', () => {
  it.each([
    0,
    -1,
    1.9,
    'PT1S',
    'PT1.000999S',
    'P1D',
    { kind: 'duration', milliseconds: 1 },
  ])(
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
    '',
    'PT',
    'P1DT',
    'P1M',
    ' PT1S',
    'PT1S ',
    'PT1S✨',
    { kind: 'other', milliseconds: 1 },
    { kind: 'duration' },
    { kind: 'duration', milliseconds: '1' },
    { kind: 'duration', milliseconds: Infinity },
  ])(
    'Given an invalid duration input %s, When validating it, Then it returns false',
    (value) => {
      expect(nativeIsValidDuration(value)).toBe(false);
    },
  );
});
