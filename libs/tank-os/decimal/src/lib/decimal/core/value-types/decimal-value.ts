import { InvalidDecimalError } from '../errors';

/** A canonical, finite decimal represented without locale formatting. */
export type DecimalValue = string & { readonly __decimalValue: unique symbol };

/** Values accepted at the decimal input boundary. */
export type DecimalInput = number | string;

const DECIMAL_PATTERN =
  /^[+-]?(?:(?:\d+(?:\.\d*)?)|(?:\.\d+))(?:[eE][+-]?\d+)?$/;
/** Maximum accepted exponent magnitude at the public input boundary. */
export const MAX_DECIMAL_EXPONENT = 1_000;
/** Maximum serialized canonical value length at the public input boundary. */
export const MAX_DECIMAL_STRING_LENGTH = 4_096;

/** Normalizes and validates a decimal input into its canonical string form. */
export function normalizeDecimalInput(value: DecimalInput): DecimalValue {
  const source = typeof value === 'number' ? normalizeNumber(value) : value;

  if (
    typeof source !== 'string' ||
    source.length > MAX_DECIMAL_STRING_LENGTH ||
    !DECIMAL_PATTERN.test(source)
  ) {
    throw new InvalidDecimalError(value);
  }

  const match = /^([+-]?)(\d*)(?:\.(\d*))?(?:[eE]([+-]?\d+))?$/.exec(source);

  if (!match) {
    throw new InvalidDecimalError(value);
  }

  const [, sign, integerPart, fractionalPart = '', exponentText = '0'] = match;
  const exponent = Number(exponentText);

  if (
    !Number.isSafeInteger(exponent) ||
    Math.abs(exponent) > MAX_DECIMAL_EXPONENT
  ) {
    throw new InvalidDecimalError(value);
  }

  const digits = `${integerPart}${fractionalPart}`;
  const decimalPosition = integerPart.length + exponent;
  const estimatedLength =
    digits.length +
    Math.max(0, -decimalPosition) +
    Math.max(0, decimalPosition - digits.length);

  if (estimatedLength > MAX_DECIMAL_STRING_LENGTH) {
    throw new InvalidDecimalError(value);
  }

  const unsigned = formatDigits(digits, decimalPosition);

  return (
    unsigned === '0' ? '0' : `${sign === '-' ? '-' : ''}${unsigned}`
  ) as DecimalValue;
}

function normalizeNumber(value: number): string {
  if (!Number.isFinite(value)) {
    throw new InvalidDecimalError(value);
  }

  return String(value);
}

function formatDigits(digits: string, decimalPosition: number): string {
  if (/^0+$/.test(digits)) {
    return '0';
  }

  let formatted: string;
  if (decimalPosition <= 0) {
    formatted = `0.${'0'.repeat(-decimalPosition)}${digits}`;
  } else if (decimalPosition >= digits.length) {
    formatted = `${digits}${'0'.repeat(decimalPosition - digits.length)}`;
  } else {
    formatted = `${digits.slice(0, decimalPosition)}.${digits.slice(
      decimalPosition,
    )}`;
  }

  const [integerPart, fractionalPart] = formatted.split('.');
  const normalizedInteger = integerPart.replace(/^0+(?=\d)/, '');
  const normalizedFractional = (fractionalPart ?? '').replace(/0+$/, '');

  return normalizedFractional
    ? `${normalizedInteger}.${normalizedFractional}`
    : normalizedInteger;
}
