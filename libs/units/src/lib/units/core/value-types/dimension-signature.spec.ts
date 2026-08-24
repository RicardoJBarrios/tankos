import {
  areDimensionsCompatible,
  createDimensionSignature,
} from './dimension-signature';
import { DimensionSignatureError } from '../errors';

describe('createDimensionSignature', () => {
  it('Given partial exponents, When created, Then fills absent SI dimensions with zero', () => {
    expect(createDimensionSignature({ length: 1, time: -1 })).toEqual({
      length: 1,
      mass: 0,
      time: -1,
      temperature: 0,
      amountOfSubstance: 0,
      electricCurrent: 0,
      luminousIntensity: 0,
    });
  });

  it('Given a signature, When created, Then prevents mutation', () => {
    const signature = createDimensionSignature({ mass: 1 });

    expect(Object.isFrozen(signature)).toBe(true);
  });

  it.each([NaN, Infinity, -Infinity, 1.5, Number.MAX_SAFE_INTEGER + 1])(
    'Given an invalid exponent %s, When created, Then throws DimensionSignatureError',
    (exponent) => {
      expect(() => createDimensionSignature({ length: exponent })).toThrow(
        DimensionSignatureError,
      );
    },
  );
});

describe('areDimensionsCompatible', () => {
  it('Given equal signatures, When compared, Then returns true', () => {
    expect(
      areDimensionsCompatible(
        createDimensionSignature({ length: 1 }),
        createDimensionSignature({ length: 1 }),
      ),
    ).toBe(true);
  });

  it('Given different signatures, When compared, Then returns false', () => {
    expect(
      areDimensionsCompatible(
        createDimensionSignature({ length: 1 }),
        createDimensionSignature({ mass: 1 }),
      ),
    ).toBe(false);
  });
});
