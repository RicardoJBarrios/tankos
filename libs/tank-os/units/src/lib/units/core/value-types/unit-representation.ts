/** Placement of a unit symbol relative to its numeric value. */
export type UnitSymbolPosition = 'prefix' | 'suffix';

/** Spacing rule between a numeric value and its unit symbol. */
export type UnitSymbolSpacing = 'none' | 'narrow' | 'normal';

/** Scientific and accessibility metadata for a unit symbol. */
export interface UnitRepresentation {
  readonly symbol: string;
  readonly asciiFallback: string;
  readonly position: UnitSymbolPosition;
  readonly spacing: UnitSymbolSpacing;
}

/** Creates immutable representation metadata for a unit. */
export function createUnitRepresentation(
  representation: UnitRepresentation,
): UnitRepresentation {
  return Object.freeze({ ...representation });
}
