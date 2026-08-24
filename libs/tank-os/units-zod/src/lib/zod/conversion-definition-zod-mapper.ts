import type { ConversionDefinition } from '@tank-os/units';
import type { ConversionDefinitionDto } from './conversion-definition-zod-schema';

/** Serializes an immutable conversion definition into its strict external DTO. */
export function conversionDefinitionToDto(
  definition: ConversionDefinition,
): ConversionDefinitionDto {
  return {
    code: definition.code,
    version: definition.version,
    origin: definition.origin,
    sourceUnit: definition.sourceUnit,
    targetUnit: definition.targetUnit,
    family: definition.family,
    kind: definition.kind,
    factor: { ...definition.factor },
    offset:
      typeof definition.offset === 'string'
        ? definition.offset
        : { ...definition.offset },
    divisionContext: definition.divisionContext
      ? { ...definition.divisionContext }
      : undefined,
    provenance: definition.provenance,
  };
}
