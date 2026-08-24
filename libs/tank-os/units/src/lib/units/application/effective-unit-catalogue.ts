import type { UnitCataloguePort, UnitDefinition } from '../core';
import { UnitError } from '../core';

/** Dependencies used to compose the operational unit catalogue. */
export interface EffectiveUnitCatalogueDependencies {
  readonly standard: UnitCataloguePort;
  readonly custom: readonly UnitDefinition[];
}

/**
 * Composes standard and active custom units into one deterministic catalogue.
 *
 * Standard definitions remain the fixed source of truth. Custom definitions
 * must use the custom system and cannot collide with an active code already
 * present in either catalogue.
 */
export function createEffectiveUnitCatalogue(
  dependencies: EffectiveUnitCatalogueDependencies,
): UnitCataloguePort {
  const standard = dependencies.standard.list().filter(isActive);
  const custom = dependencies.custom.filter(isActive);

  for (const definition of dependencies.custom) {
    if (definition.system !== 'custom') {
      throw new UnitError(
        'UNIT_CUSTOM_REQUIRED',
        'The custom catalogue accepts only custom unit definitions',
      );
    }
  }

  const units = [...standard, ...custom].sort((left, right) =>
    left.code.localeCompare(right.code),
  );
  const codes = new Set<string>();

  for (const unit of units) {
    if (codes.has(unit.code)) {
      throw new UnitError(
        'UNIT_CATALOGUE_CODE_COLLISION',
        `Unit code is present more than once: ${unit.code}`,
      );
    }
    codes.add(unit.code);
  }

  const operational = Object.freeze(units);
  return {
    list: () => operational,
    find: (code) => operational.find((unit) => unit.code === code),
  };
}

function isActive(definition: UnitDefinition): boolean {
  return definition.status === 'active';
}
