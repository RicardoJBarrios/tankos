import type { UnitDefinition } from '@tankos/units';
import type { UnitDefinitionDto } from './unit-definition-zod-schema';

/** Serializes an immutable unit definition into its strict external DTO. */
export function unitDefinitionToDto(
  definition: UnitDefinition,
): UnitDefinitionDto {
  return {
    code: definition.code,
    system: definition.system,
    dimension: { ...definition.dimension },
    quantityKind: definition.quantityKind,
    representation: { ...definition.representation },
    conversionFamily: definition.conversionFamily,
    catalogueVersion: definition.catalogueVersion,
    status: definition.status,
  };
}
