import type { UnitDefinition } from '@tankos/units';
import type { UnitDefinitionDto } from './unit-definition-zod-schema';

/** Serializes an immutable unit definition into its strict external DTO. */
export function unitDefinitionToDto(
  definition: UnitDefinition,
): UnitDefinitionDto {
  return {
    code: definition.code,
    codeSearchTokens: searchTokens(definition.code),
    ...(definition.ownerName === undefined
      ? {}
      : { ownerSearchTokens: searchTokens(definition.ownerName) }),
    ...(definition.ownerId === undefined
      ? {}
      : { ownerId: definition.ownerId }),
    ...(definition.ownerName === undefined
      ? {}
      : { ownerName: definition.ownerName }),
    visibility: definition.visibility,
    system: definition.system,
    representation: { ...definition.representation },
    catalogueVersion: definition.catalogueVersion,
  };
}

function searchTokens(value: string): string[] {
  const normalized = value.trim().toLocaleLowerCase();
  const tokens = new Set<string>();
  for (let start = 0; start < normalized.length; start += 1) {
    for (let end = start + 1; end <= normalized.length; end += 1) {
      tokens.add(normalized.slice(start, end));
    }
  }
  return [...tokens];
}
