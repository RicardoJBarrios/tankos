import type { UnitDefinition } from '@tankos/units';
import type { AccessContext } from '@tankos/data-access';

export function createUnitDefinitionId(input: UnitDefinition): string {
  return normalizeIdPart(input.code);
}

/** Version ids are distinct while the canonical code id remains reserved. */
export function createUnitDefinitionReplacementId(
  input: UnitDefinition,
  access: AccessContext,
): string {
  return `${normalizeIdPart(input.code)}-revision-${normalizeIdPart(access.requestId ?? 'unknown')}`;
}

function normalizeIdPart(value: string): string {
  return value.replace(/[^0-9A-Za-z]+/gu, '-').toLowerCase();
}
