import { describe, expect, it } from 'vitest';
import { createStandardUnitCatalogue } from '../adapters/standard';
import { createConversionDefinition, createUnitCode } from '../core';
import { validateConversionDefinition } from './conversion-definition-validator';

const NOT_ACTIVE_PATTERN = /not active/iu;
const INCOMPATIBLE_PATTERN = /incompatible/iu;

describe('validateConversionDefinition', () => {
  const catalogue = createStandardUnitCatalogue();
  const base = {
    code: 'TANKOS:CUSTOM-LTR-MLT',
    version: '1',
    origin: 'custom' as const,
    sourceUnit: createUnitCode('UN/CEFACT:LTR'),
    targetUnit: createUnitCode('UN/CEFACT:MLT'),
    family: 'volume',
    kind: 'linear' as const,
    factor: { numerator: '1000', denominator: '1' },
    offset: '0',
    provenance: 'test',
  };

  it('Given active compatible endpoints, When validated, Then returns the original definition', () => {
    const definition = createConversionDefinition(base);

    expect(validateConversionDefinition(definition, { catalogue })).toBe(
      definition,
    );
  });

  it('Given an unknown endpoint, When validated, Then rejects the conversion', () => {
    const definition = createConversionDefinition({
      ...base,
      sourceUnit: createUnitCode('UN/CEFACT:UNKNOWN'),
    });

    expect(() =>
      validateConversionDefinition(definition, { catalogue }),
    ).toThrow(NOT_ACTIVE_PATTERN);
  });

  it('Given incompatible endpoints, When validated, Then rejects the conversion', () => {
    const definition = createConversionDefinition({
      ...base,
      targetUnit: createUnitCode('UN/CEFACT:KGM'),
    });

    expect(() =>
      validateConversionDefinition(definition, { catalogue }),
    ).toThrow(INCOMPATIBLE_PATTERN);
  });
});
