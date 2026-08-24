import { DimensionSignatureError } from '../errors';

/** SI base dimensions supported by TankOS unit compatibility. */
export type BaseDimension =
  | 'length'
  | 'mass'
  | 'time'
  | 'temperature'
  | 'amountOfSubstance'
  | 'electricCurrent'
  | 'luminousIntensity';

/** Immutable dimensional exponents used for compatibility checks. */
export type DimensionSignature = Readonly<Record<BaseDimension, number>>;

const BASE_DIMENSIONS: readonly BaseDimension[] = [
  'length',
  'mass',
  'time',
  'temperature',
  'amountOfSubstance',
  'electricCurrent',
  'luminousIntensity',
];

/** Creates a complete, validated dimensional signature. */
export function createDimensionSignature(
  values: Partial<Record<BaseDimension, number>> = {},
): DimensionSignature {
  const signature = Object.fromEntries(
    BASE_DIMENSIONS.map((dimension) => {
      const exponent = values[dimension] ?? 0;
      if (!Number.isSafeInteger(exponent)) {
        throw new DimensionSignatureError(dimension, exponent);
      }

      return [dimension, exponent];
    }),
  ) as Record<BaseDimension, number>;

  return Object.freeze(signature);
}

/** Compares two dimensional signatures without considering their labels. */
export function areDimensionsCompatible(
  left: DimensionSignature,
  right: DimensionSignature,
): boolean {
  return BASE_DIMENSIONS.every(
    (dimension) => left[dimension] === right[dimension],
  );
}
