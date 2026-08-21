import type { DimensionSignature } from './dimension-signature';
import type { QuantityKind } from './quantity-kind';
import type { UnitCode } from './unit-code';
import type { UnitRepresentation } from './unit-representation';

/** Unit-system identities supported by TankOS. */
export type UnitSystem =
  'si' | 'metric' | 'british-imperial' | 'us-customary' | 'custom';

/** Availability state of a versioned unit definition. */
export type UnitDefinitionStatus = 'active' | 'deprecated' | 'retired';

/** Immutable, value-free definition of a physical unit. */
export interface UnitDefinition {
  readonly code: UnitCode;
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
  return Object.freeze({ ...definition });
}
