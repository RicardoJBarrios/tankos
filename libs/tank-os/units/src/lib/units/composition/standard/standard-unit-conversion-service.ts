import type { DecimalArithmeticPort } from '@tank-os/decimal';
import { createUnitConversionService } from '../../application';
import type { UnitConversionPort } from '../../core';
import {
  createStandardConversionDefinitions,
  createStandardUnitCatalogue,
} from '../../adapters/standard';

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
