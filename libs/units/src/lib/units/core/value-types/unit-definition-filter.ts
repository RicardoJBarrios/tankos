import type { QuantityKind } from './quantity-kind';
import type { UnitCode } from './unit-code';
import type { UnitDefinitionStatus, UnitSystem } from './unit-definition';

/** Filter used by the custom unit catalogue management flow. */
export interface UnitDefinitionFilter {
  readonly code?: UnitCode;
  readonly quantityKind?: QuantityKind;
  readonly system?: UnitSystem;
  readonly status?: UnitDefinitionStatus;
}
