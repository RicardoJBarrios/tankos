import type { DimensionSignature } from './dimension-signature';
import type { QuantityKind } from './quantity-kind';
import type { UnitCode } from './unit-code';
import type { UnitRepresentation } from './unit-representation';

/** Unit-system identities supported by TankOS. */
export type UnitSystem =
  'si' | 'metric' | 'british-imperial' | 'us-customary' | 'custom';

/** Availability state of a versioned unit definition. */
export type UnitDefinitionStatus = 'active' | 'deprecated' | 'retired';

/** Visibility of a unit definition in the shared technical catalogue. */
export type UnitDefinitionVisibility = 'private' | 'global';

/** Immutable, value-free definition of a physical unit. */
export interface UnitDefinition {
  readonly code: UnitCode;
  /** Owner identity for private custom definitions. */
  readonly ownerId?: string;
  readonly visibility?: UnitDefinitionVisibility;
  readonly system: UnitSystem;
  readonly dimension: DimensionSignature;
  readonly quantityKind: QuantityKind;
  readonly representation: UnitRepresentation;
  readonly conversionFamily: string;
  readonly catalogueVersion: string;
  readonly status: UnitDefinitionStatus;
}

/** Freezes a complete unit definition without changing its public identity. */
export function createUnitDefinition(
  definition: UnitDefinition,
): UnitDefinition {
  if (!definition || typeof definition !== 'object') {
    throw new TypeError('Unit definition must be an object');
  }
  if (
    !['si', 'metric', 'british-imperial', 'us-customary', 'custom'].includes(
      definition.system,
    )
  ) {
    throw new TypeError('Unit definition system is invalid');
  }
  if (!isNonEmptyTrimmedString(definition.conversionFamily)) {
    throw new TypeError('Unit conversion family must be non-empty');
  }
  if (!isNonEmptyTrimmedString(definition.catalogueVersion)) {
    throw new TypeError('Unit catalogue version must be non-empty');
  }
  if (!['active', 'deprecated', 'retired'].includes(definition.status)) {
    throw new TypeError('Unit definition status is invalid');
  }

  return Object.freeze({
    code: definition.code,
    ...(definition.ownerId === undefined
      ? {}
      : { ownerId: definition.ownerId }),
    ...(definition.visibility === undefined
      ? {}
      : { visibility: definition.visibility }),
    system: definition.system,
    dimension: Object.freeze({ ...definition.dimension }),
    quantityKind: definition.quantityKind,
    representation: Object.freeze({ ...definition.representation }),
    conversionFamily: definition.conversionFamily,
    catalogueVersion: definition.catalogueVersion,
    status: definition.status,
  });
}

function isNonEmptyTrimmedString(value: unknown): value is string {
  return (
    typeof value === 'string' && value.length > 0 && value === value.trim()
  );
}
