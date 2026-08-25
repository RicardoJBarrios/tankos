import { InvalidDecimalError } from '../errors';
import {
  MAX_DECIMAL_EXPONENT,
  MAX_DECIMAL_STRING_LENGTH,
  normalizeDecimalInput,
} from './decimal-value';

describe('normalizeDecimalInput', () => {
  it.each([
    [0, '0'],
    [-0, '0'],
    [35, '35'],
    [-0.5, '-0.5'],
    ['001.2300', '1.23'],
    ['.5', '0.5'],
    ['1.', '1'],
    ['1e-6', '0.000001'],
    ['-2.5E+3', '-2500'],
  ])(
    'Given a supported input %s, When normalized, Then returns %s',
    (input, expected) => {
      expect(normalizeDecimalInput(input)).toBe(expected);
    },
  );

  it('Given an exponent that cannot be represented safely, When normalized, Then rejects it', () => {
    expect(() => normalizeDecimalInput('1e999999999999999999999')).toThrow(
      InvalidDecimalError,
    );
  });

  it.each([NaN, Infinity, -Infinity, null, undefined, true, [], {}])(
    'Given a non-decimal value %s, When normalized, Then throws an invalid input error',
    (input) => {
      expect(() => normalizeDecimalInput(input as never)).toThrow(
        InvalidDecimalError,
      );
    },
  );

  it.each([
    '',
    ' ',
    ' 1',
    '1 ',
    '1,25',
    '0x10',
    '1_000',
    '1/2',
    'NaN',
    'Infinity',
    '--1',
    '.',
    '1e9999999',
    `1e${MAX_DECIMAL_EXPONENT + 1}`,
    `1e-${MAX_DECIMAL_EXPONENT + 1}`,
  ])(
    'Given an invalid decimal string %s, When normalized, Then throws an invalid input error',
    (input) => {
      expect(() => normalizeDecimalInput(input)).toThrow(InvalidDecimalError);
    },
  );

  it('Given an input at the exponent boundary, When normalized, Then accepts it without exceeding the output limit', () => {
    expect(normalizeDecimalInput(`1e${MAX_DECIMAL_EXPONENT}`)).toHaveLength(
      MAX_DECIMAL_EXPONENT + 1,
    );
  });

  it('Given an oversized decimal string, When normalized, Then rejects it before expansion', () => {
    const oversized = '1'.repeat(MAX_DECIMAL_STRING_LENGTH + 1);

    expect(() => normalizeDecimalInput(oversized)).toThrow(InvalidDecimalError);
  });
});
