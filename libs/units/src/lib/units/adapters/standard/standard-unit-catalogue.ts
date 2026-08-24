import type { UnitCataloguePort } from '../../core';
import {
  createDimensionSignature,
  createQuantityKind,
  createUnitCode,
  createUnitDefinition,
  createUnitRepresentation,
  type UnitDefinition,
} from '../../core';

const CATALOGUE_VERSION = 'UN/CEFACT-Rev17-aquarium-core';

const STANDARD_UNITS: readonly UnitDefinition[] = Object.freeze([
  definition(
    'UN/CEFACT:BAR',
    'metric',
    { mass: 1, length: -1, time: -2 },
    'pressure',
    'pressure',
    'bar',
  ),
  definition(
    'UN/CEFACT:CEL',
    'si',
    { temperature: 1 },
    'temperature',
    'temperature',
    '°C',
  ),
  definition('UN/CEFACT:CMT', 'si', { length: 1 }, 'length', 'length', 'cm'),
  definition(
    'UN/CEFACT:FAH',
    'us-customary',
    { temperature: 1 },
    'temperature',
    'temperature',
    '°F',
  ),
  definition(
    'UN/CEFACT:GLI',
    'british-imperial',
    { length: 3 },
    'volume',
    'volume',
    'gal (UK)',
  ),
  definition(
    'UN/CEFACT:GLL',
    'us-customary',
    { length: 3 },
    'volume',
    'volume',
    'gal (US)',
  ),
  definition('UN/CEFACT:GRM', 'si', { mass: 1 }, 'mass', 'mass', 'g'),
  definition(
    'UN/CEFACT:KEL',
    'si',
    { temperature: 1 },
    'temperature',
    'temperature',
    'K',
  ),
  definition('UN/CEFACT:KGM', 'si', { mass: 1 }, 'mass', 'mass', 'kg'),
  definition('UN/CEFACT:LTR', 'si', { length: 3 }, 'volume', 'volume', 'L'),
  definition('UN/CEFACT:MLT', 'si', { length: 3 }, 'volume', 'volume', 'mL'),
  definition('UN/CEFACT:MTR', 'si', { length: 1 }, 'length', 'length', 'm'),
  definition(
    'UN/CEFACT:PAL',
    'si',
    { mass: 1, length: -1, time: -2 },
    'pressure',
    'pressure',
    'Pa',
  ),
]);

/** Creates the immutable aquarium-first standard unit catalogue. */
export function createStandardUnitCatalogue(): UnitCataloguePort {
  return {
    list: () => STANDARD_UNITS,
    find: (code) => STANDARD_UNITS.find((unit) => unit.code === code),
  };
}

function definition(
  code: string,
  system: UnitDefinition['system'],
  dimensions: Parameters<typeof createDimensionSignature>[0],
  quantityKind: string,
  conversionFamily: string,
  symbol: string,
): UnitDefinition {
  return createUnitDefinition({
    code: createUnitCode(code),
    system,
    dimension: createDimensionSignature(dimensions),
    quantityKind: createQuantityKind(quantityKind),
    representation: createUnitRepresentation({
      symbol,
      asciiFallback: asciiFallbackFor(symbol),
      position: 'suffix',
      spacing: 'narrow',
    }),
    conversionFamily,
    catalogueVersion: CATALOGUE_VERSION,
    status: 'active',
  });
}

function asciiFallbackFor(symbol: string): string {
  if (symbol === '°C') return 'degC';
  if (symbol === '°F') return 'degF';
  return symbol;
}
