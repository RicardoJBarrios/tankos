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
  if (!representation || typeof representation !== 'object') {
    throw new TypeError('Unit representation must be an object');
  }
  if (!isNonEmptyTrimmedString(representation.symbol)) {
    throw new TypeError('Unit representation symbol must be non-empty');
  }
  if (!isNonEmptyTrimmedString(representation.asciiFallback)) {
    throw new TypeError('Unit representation ASCII fallback must be non-empty');
  }
  if (!['prefix', 'suffix'].includes(representation.position)) {
    throw new TypeError('Unit representation position is invalid');
  }
  if (!['none', 'narrow', 'normal'].includes(representation.spacing)) {
    throw new TypeError('Unit representation spacing is invalid');
  }

  return Object.freeze({
    symbol: representation.symbol,
    asciiFallback: representation.asciiFallback,
    position: representation.position,
    spacing: representation.spacing,
  });
}

function isNonEmptyTrimmedString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value === value.trim();
}
