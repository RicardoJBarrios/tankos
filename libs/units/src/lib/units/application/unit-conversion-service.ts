import {
  DecimalDivisionByZeroError,
  normalizeDecimalInput,
  type DecimalArithmeticPort,
  type DecimalValue,
} from '@tankos/decimal';
import type {
  ConversionDefinition,
  ConversionRequest,
  ConversionResult,
  UnitCataloguePort,
  UnitConversionPort,
} from '../core';
import { UnitConversionError } from '../core';

/** Dependencies required by the deterministic conversion application service. */
export interface UnitConversionServiceDependencies {
  readonly arithmetic: DecimalArithmeticPort;
  readonly catalogue: UnitCataloguePort;
  readonly definitions: readonly ConversionDefinition[];
}

/** Creates a conversion port that validates units before delegating arithmetic. */
export function createUnitConversionService(
  dependencies: UnitConversionServiceDependencies,
): UnitConversionPort {
  return {
    convert: (request) => convert(request, dependencies),
  };
}

function convert(
  request: ConversionRequest,
  dependencies: UnitConversionServiceDependencies,
): ConversionResult {
  const source = dependencies.catalogue.find(request.sourceUnit);
  const target = dependencies.catalogue.find(request.targetUnit);

  if (!source || !target) {
    throw new UnitConversionError(
      'UNIT_CONVERSION_UNIT_UNKNOWN',
      'Source or target unit is not present in the catalogue',
    );
  }

  const definition = dependencies.definitions.find(
    (candidate) =>
      candidate.sourceUnit === request.sourceUnit &&
      candidate.targetUnit === request.targetUnit,
  );

  if (!definition) {
    throw new UnitConversionError(
      'UNIT_CONVERSION_UNAVAILABLE',
      'No declared conversion exists for the requested units',
    );
  }

  const value = normalizeDecimalInput(request.value);
  const scaled = applyFactor(
    value,
    definition.factor,
    definition.divisionContext,
    dependencies.arithmetic,
  );
  const result =
    definition.kind === 'affine'
      ? dependencies.arithmetic.add(
          scaled,
          applyOffset(
            definition.offset,
            definition.divisionContext,
            dependencies.arithmetic,
          ),
        )
      : scaled;

  return Object.freeze({
    value: result,
    sourceUnit: request.sourceUnit,
    targetUnit: request.targetUnit,
    conversionCode: definition.code,
    conversionVersion: definition.version,
  });
}

function applyOffset(
  offset: ConversionDefinition['offset'],
  divisionContext: ConversionDefinition['divisionContext'],
  arithmetic: DecimalArithmeticPort,
): DecimalValue {
  if (typeof offset === 'string') {
    return offset;
  }

  return applyFactor('1' as DecimalValue, offset, divisionContext, arithmetic);
}

function applyFactor(
  value: DecimalValue,
  factor: ConversionDefinition['factor'],
  divisionContext: ConversionDefinition['divisionContext'],
  arithmetic: DecimalArithmeticPort,
): DecimalValue {
  const { numerator, denominator } = factor;
  const multiplied = arithmetic.multiply(value, numerator);

  if (arithmetic.compare(denominator, '1' as DecimalValue) === 0) {
    return multiplied;
  }

  if (!divisionContext) {
    throw new UnitConversionError(
      'UNIT_CONVERSION_CONTEXT_REQUIRED',
      'A conversion with a non-unit denominator requires a division context',
    );
  }

  try {
    return arithmetic.divide(multiplied, denominator, divisionContext);
  } catch (error) {
    if (error instanceof DecimalDivisionByZeroError) {
      throw new UnitConversionError(
        'UNIT_CONVERSION_DENOMINATOR_ZERO',
        'Conversion denominator must not be zero',
      );
    }

    throw error;
  }
}
