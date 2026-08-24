import type { UnitCode, UnitDefinition } from '../value-types';

/** Read-only catalogue capability for resolving versioned unit definitions. */
export interface UnitCataloguePort {
  /** Returns the complete operational catalogue in stable code order. */
  list(): readonly UnitDefinition[];
  /** Resolves a unit by its qualified public code. */
  find(code: UnitCode): UnitDefinition | undefined;
}
