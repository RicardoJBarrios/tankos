import type {
  DecimalContext,
  DecimalInput,
  DecimalValue,
} from '@tank-os/decimal';
import { normalizeDecimalInput } from '@tank-os/decimal';
import type { UnitCode } from './unit-code';

/** Conversion function family supported by the first deterministic engine. */
export type ConversionKind = 'linear' | 'affine';

/** Exact rational factor used by a conversion function. */
export interface ConversionFactor {
  readonly numerator: DecimalValue;
  readonly denominator: DecimalValue;
}

/** Input accepted for a rational conversion factor. */
export interface ConversionFactorInput {
  readonly numerator: DecimalInput;
  readonly denominator: DecimalInput;
}

/** Versioned, declared transformation between two unit identities. */
export interface ConversionDefinition {
  readonly code: string;
  readonly version: string;
  readonly sourceUnit: UnitCode;
  readonly targetUnit: UnitCode;
  readonly family: string;
  readonly kind: ConversionKind;
  readonly factor: ConversionFactor;
  readonly offset: DecimalValue | ConversionFactor;
  readonly divisionContext?: DecimalContext;
  readonly provenance: string;
}

/** Input accepted when defining a conversion factor or affine offset. */
export interface ConversionDefinitionInput extends Omit<
  ConversionDefinition,
  'factor' | 'offset'
> {
  readonly factor: ConversionFactorInput;
  readonly offset: DecimalInput | ConversionFactorInput;
}

/** Creates an immutable conversion definition with canonical decimal values. */
export function createConversionDefinition(
  definition: ConversionDefinitionInput,
): ConversionDefinition {
  if (!definition.code.trim() || !definition.version.trim()) {
    throw new TypeError(
      'Conversion code and version must be non-empty strings',
    );
  }

  if (!definition.family.trim() || !definition.provenance.trim()) {
    throw new TypeError(
      'Conversion family and provenance must be non-empty strings',
    );
  }

  const denominator = normalizeDecimalInput(definition.factor.denominator);
  if (denominator === '0') {
    throw new TypeError('Conversion denominator must not be zero');
  }

  return Object.freeze({
    ...definition,
    factor: Object.freeze({
      numerator: normalizeDecimalInput(definition.factor.numerator),
      denominator,
    }),
    offset: normalizeOffset(definition.offset),
  });
}

function normalizeOffset(
  offset: DecimalInput | ConversionFactorInput,
): DecimalValue | ConversionFactor {
  if (typeof offset === 'object' && offset !== null) {
    const denominator = normalizeDecimalInput(offset.denominator);
    if (denominator === '0') {
      throw new TypeError('Conversion offset denominator must not be zero');
    }

    return Object.freeze({
      numerator: normalizeDecimalInput(offset.numerator),
      denominator,
    });
  }

  return normalizeDecimalInput(offset);
}
