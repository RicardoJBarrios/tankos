import type { DecimalArithmeticPort } from '@tank-os/decimal';
import { createUnitConversionService } from '../../application';
import type { UnitConversionPort } from '../../core';
import { createStandardConversionDefinitions } from './standard-conversion-definitions';
import { createStandardUnitCatalogue } from './standard-unit-catalogue';

/** Creates the standard conversion port for the aquarium-first catalogue. */
export function createStandardUnitConversionService(
  arithmetic: DecimalArithmeticPort,
): UnitConversionPort {
  return createUnitConversionService({
    arithmetic,
    catalogue: createStandardUnitCatalogue(),
    definitions: createStandardConversionDefinitions(),
  });
}
