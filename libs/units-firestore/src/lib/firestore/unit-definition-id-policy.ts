import type { UnitDefinition } from '@tankos/units';
import type { AccessContext } from '@tankos/data-access';

export function createUnitDefinitionId(
  input: UnitDefinition,
  access: AccessContext | undefined,
): string {
  const code = normalizeIdPart(input.code);
  const requestId = access?.requestId
    ? normalizeIdPart(access.requestId)
    : undefined;
  return requestId ? `${code}-${requestId}` : code;
}

function normalizeIdPart(value: string): string {
  return value.replace(/[^0-9A-Za-z]+/gu, '-').toLowerCase();
}
