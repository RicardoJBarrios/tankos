import { createDecimalContext } from '@tank-os/decimal';
import {
  createConversionDefinition,
  createUnitCode,
  type ConversionDefinition,
  type ConversionDefinitionInput,
} from '../../core';

const PROVENANCE = 'UN/CEFACT-Rev17-aquarium-core';
const REPEATING_CONTEXT = createDecimalContext(8, 'half-up');

const STANDARD_CONVERSIONS: readonly ConversionDefinition[] = Object.freeze([
  conversion(
    'volume-litre-to-millilitre',
    'UN/CEFACT:LTR',
    'UN/CEFACT:MLT',
    '1000',
    '1',
  ),
  conversion(
    'volume-millilitre-to-litre',
    'UN/CEFACT:MLT',
    'UN/CEFACT:LTR',
    '1',
    '1000',
    REPEATING_CONTEXT,
  ),
  conversion(
    'length-metre-to-centimetre',
    'UN/CEFACT:MTR',
    'UN/CEFACT:CMT',
    '100',
    '1',
  ),
  conversion(
    'length-centimetre-to-metre',
    'UN/CEFACT:CMT',
    'UN/CEFACT:MTR',
    '1',
    '100',
    REPEATING_CONTEXT,
  ),
  conversion(
    'mass-kilogram-to-gram',
    'UN/CEFACT:KGM',
    'UN/CEFACT:GRM',
    '1000',
    '1',
  ),
  conversion(
    'mass-gram-to-kilogram',
    'UN/CEFACT:GRM',
    'UN/CEFACT:KGM',
    '1',
    '1000',
    REPEATING_CONTEXT,
  ),
  affineConversion(
    'temperature-celsius-to-kelvin',
    'UN/CEFACT:CEL',
    'UN/CEFACT:KEL',
    '1',
    '1',
    '273.15',
  ),
  affineConversion(
    'temperature-kelvin-to-celsius',
    'UN/CEFACT:KEL',
    'UN/CEFACT:CEL',
    '1',
    '1',
    '-273.15',
  ),
  affineConversion(
    'temperature-celsius-to-fahrenheit',
    'UN/CEFACT:CEL',
    'UN/CEFACT:FAH',
    '9',
    '5',
    '32',
    REPEATING_CONTEXT,
  ),
  affineConversion(
    'temperature-fahrenheit-to-celsius',
    'UN/CEFACT:FAH',
    'UN/CEFACT:CEL',
    '5',
    '9',
    { numerator: '-160', denominator: '9' },
    REPEATING_CONTEXT,
  ),
  conversion(
    'pressure-bar-to-pascal',
    'UN/CEFACT:BAR',
    'UN/CEFACT:PAL',
    '100000',
    '1',
  ),
  conversion(
    'pressure-pascal-to-bar',
    'UN/CEFACT:PAL',
    'UN/CEFACT:BAR',
    '1',
    '100000',
    REPEATING_CONTEXT,
  ),
]);

/** Returns the immutable aquarium-first standard conversion definitions. */
export function createStandardConversionDefinitions(): readonly ConversionDefinition[] {
  return STANDARD_CONVERSIONS;
}

function conversion(
  code: string,
  sourceUnit: string,
  targetUnit: string,
  numerator: string,
  denominator: string,
  divisionContext?: ConversionDefinitionInput['divisionContext'],
): ConversionDefinition {
  return createConversionDefinition({
    code,
    version: '1',
    origin: 'standard',
    sourceUnit: createUnitCode(sourceUnit),
    targetUnit: createUnitCode(targetUnit),
    family: code.split('-')[0],
    kind: 'linear',
    factor: { numerator, denominator },
    offset: '0',
    divisionContext,
    provenance: PROVENANCE,
  });
}

function affineConversion(
  code: string,
  sourceUnit: string,
  targetUnit: string,
  numerator: string,
  denominator: string,
  offset: ConversionDefinitionInput['offset'],
  divisionContext?: ConversionDefinitionInput['divisionContext'],
): ConversionDefinition {
  return createConversionDefinition({
    code,
    version: '1',
    origin: 'standard',
    sourceUnit: createUnitCode(sourceUnit),
    targetUnit: createUnitCode(targetUnit),
    family: code.split('-')[0],
    kind: 'affine',
    factor: { numerator, denominator },
    offset,
    divisionContext,
    provenance: PROVENANCE,
  });
}
