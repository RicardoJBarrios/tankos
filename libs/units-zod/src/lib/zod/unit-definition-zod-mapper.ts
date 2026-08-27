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
  if (!normalized) return [];
  if (normalized.length < 2) return [normalized];

  // Firestore array indexes have a per-document entry limit. Two- and
  // three-grams preserve partial candidate search with linear fan-out; the
  // UI performs the final substring check against the returned candidates.
  for (let length = 2; length <= 3; length += 1) {
    for (let start = 0; start <= normalized.length - length; start += 1) {
      tokens.add(normalized.slice(start, start + length));
    }
  }
  tokens.add(normalized);
  return [...tokens];
}

/** Returns the bounded token used to find partial-search candidates. */
export function unitDefinitionSearchToken(value: string): string | undefined {
  const normalized = value.trim().toLocaleLowerCase();
  return normalized.length >= 2 ? normalized.slice(0, 2) : undefined;
}
