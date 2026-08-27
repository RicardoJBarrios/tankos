import type { ConversionDefinition, UnitCataloguePort } from '../core';
import { UnitError } from '../core';

/** Dependencies needed to validate conversion endpoints. */
export interface ConversionDefinitionValidatorDependencies {
  readonly catalogue: UnitCataloguePort;
}

/** Validates a conversion against the active unit catalogue. */
export function validateConversionDefinition(
  definition: ConversionDefinition,
  dependencies: ConversionDefinitionValidatorDependencies,
): ConversionDefinition {
  const source = dependencies.catalogue.find(definition.sourceUnit);
  const target = dependencies.catalogue.find(definition.targetUnit);

  if (!source || !target) {
    throw new UnitError(
      'CONVERSION_UNIT_UNKNOWN',
      'Conversion source or target unit is not active in the catalogue',
    );
  }

  return definition;
}
