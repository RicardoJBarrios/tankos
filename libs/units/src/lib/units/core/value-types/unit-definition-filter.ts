import type { UnitCode } from './unit-code';
import type { UnitDefinitionVisibility, UnitSystem } from './unit-definition';

/** Filter used by the custom unit catalogue management flow. */
export interface UnitDefinitionFilter {
  readonly code?: UnitCode;
  readonly system?: UnitSystem;
  readonly visibility?: UnitDefinitionVisibility;
  readonly record?: string;
  readonly ownerId?: string;
  readonly ownerName?: string;
  readonly lifecycle?: 'active' | 'marked-for-deletion' | 'deleted';
}
