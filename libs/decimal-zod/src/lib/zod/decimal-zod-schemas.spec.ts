import {
  decimalContextSchema,
  decimalInputSchema,
  decimalValueSchema,
} from './decimal-zod-schemas';

describe('Decimal Zod schemas', () => {
  it.each([
    ['001.20', '1.2'],
    ['1e-3', '0.001'],
  ])(
    'Given a decimal transport string %s, When parsed, Then returns %s',
    (value, expected) => {
      expect(decimalValueSchema.parse(value)).toBe(expected);
    },
  );

  it.each([null, undefined, '', ' ', '1,2', NaN, Infinity, -Infinity])(
    'Given an invalid Decimal transport value %s, When parsed, Then rejects it',
    (value) => {
      expect(decimalValueSchema.safeParse(value).success).toBe(false);
    },
  );

  it.each([
    ['1.20', '1.2'],
    [0.5, '0.5'],
  ])(
    'Given a Decimal input %s, When parsed, Then returns canonical %s',
    (value, expected) => {
      expect(decimalInputSchema.parse(value)).toBe(expected);
    },
  );

  it.each([null, undefined, true, {}, NaN, Infinity, -Infinity])(
    'Given an invalid Decimal input %s, When parsed, Then rejects it',
    (value) => {
      expect(decimalInputSchema.safeParse(value).success).toBe(false);
    },
  );

  it('Given a valid context, When parsed, Then returns a frozen DecimalContext', () => {
    const result = decimalContextSchema.parse({
      decimalPlaces: 2,
      rounding: 'half-up',
    });

    expect(result).toEqual({ decimalPlaces: 2, rounding: 'half-up' });
    expect(Object.isFrozen(result)).toBe(true);
  });

  it.each([
    { decimalPlaces: -1, rounding: 'down' },
    { decimalPlaces: 2.5, rounding: 'down' },
    { decimalPlaces: 2, rounding: 'nearest' },
    { decimalPlaces: 2, rounding: 'down', extra: true },
    null,
    undefined,
  ])('Given an invalid context %s, When parsed, Then rejects it', (value) => {
    expect(decimalContextSchema.safeParse(value).success).toBe(false);
  });
});
