import type { UnitCode } from './unit-code';
import type { UnitRepresentation } from './unit-representation';

/** Unit-system identities supported by TankOS. */
export type UnitSystem =
  'si' | 'metric' | 'british-imperial' | 'us-customary' | 'custom';

/** Visibility of a unit definition in the shared technical catalogue. */
export type UnitDefinitionVisibility = 'private' | 'public';

/** Immutable, value-free definition of a physical unit. */
export interface UnitDefinition {
  readonly code: UnitCode;
  /** Owner identity for private custom definitions. */
  readonly ownerId?: string;
  /** Owner display name; authorization must always use ownerId. */
  readonly ownerName?: string;
  /** Defaults to public for built-in definitions loaded from legacy data. */
  readonly visibility?: UnitDefinitionVisibility;
  readonly system: UnitSystem;
  readonly representation: UnitRepresentation;
  readonly catalogueVersion: string;
}

/** Freezes a complete unit definition without changing its public identity. */
export function createUnitDefinition(
  definition: UnitDefinition,
): UnitDefinition {
  if (!definition || typeof definition !== 'object') {
    throw new TypeError('Unit definition must be an object');
  }
  if (!isValidUnitSystem(definition.system)) {
    throw new TypeError('Unit definition system is invalid');
  }
  if (!isNonEmptyTrimmedString(definition.catalogueVersion)) {
    throw new TypeError('Unit catalogue version must be non-empty');
  }
  const visibility = definition.visibility ?? 'public';
  if (!isValidVisibility(visibility)) {
    throw new TypeError('Unit definition visibility is invalid');
  }
  if (
    visibility === 'private' &&
    !isNonEmptyTrimmedString(definition.ownerId)
  ) {
    throw new TypeError('Private unit definitions require an owner');
  }
  const optionalProperties = optionalUnitProperties(definition);

  return Object.freeze({
    code: definition.code,
    ...optionalProperties,
    visibility,
    system: definition.system,
    representation: Object.freeze({ ...definition.representation }),
    catalogueVersion: definition.catalogueVersion,
  });
}

function optionalUnitProperties(definition: UnitDefinition): {
  readonly ownerId?: string;
  readonly ownerName?: string;
} {
  const properties: { ownerId?: string; ownerName?: string } = {};
  if (definition.ownerId !== undefined) properties.ownerId = definition.ownerId;
  if (definition.ownerName !== undefined)
    properties.ownerName = definition.ownerName;
  return properties;
}

function isValidUnitSystem(value: unknown): value is UnitSystem {
  return [
    'si',
    'metric',
    'british-imperial',
    'us-customary',
    'custom',
  ].includes(value as UnitSystem);
}

function isValidVisibility(value: unknown): value is UnitDefinitionVisibility {
  return value === 'private' || value === 'public';
}

function isNonEmptyTrimmedString(value: unknown): value is string {
  return (
    typeof value === 'string' && value.length > 0 && value === value.trim()
  );
}
