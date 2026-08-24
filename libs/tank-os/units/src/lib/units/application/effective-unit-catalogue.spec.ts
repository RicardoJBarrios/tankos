import { describe, expect, it } from 'vitest';
import {
  createDimensionSignature,
  createQuantityKind,
  createUnitCode,
  createUnitDefinition,
  createUnitRepresentation,
  type UnitDefinition,
} from '../core';
import { createStandardUnitCatalogue } from '../adapters/standard';
import { createEffectiveUnitCatalogue } from './effective-unit-catalogue';

describe('createEffectiveUnitCatalogue', () => {
  const custom = createDefinition('TANKOS:CUSTOM-ALK');

  it('Given standard and active custom units, When composed, Then returns stable merged lookup data', () => {
    const catalogue = createEffectiveUnitCatalogue({
      standard: createStandardUnitCatalogue(),
      custom: [custom],
    });

    expect(catalogue.find(custom.code)).toBe(custom);
    expect(catalogue.find(createUnitCode('UN/CEFACT:LTR'))).toBeDefined();
    expect(catalogue.list().map((unit) => unit.code)).toEqual(
      [...catalogue.list()].map((unit) => unit.code).sort(),
    );
  });

  it.each([
    createDefinition('TANKOS:CUSTOM-RETIRED', 'retired'),
    createDefinition('TANKOS:CUSTOM-DEPRECATED', 'deprecated'),
  ])('Given an inactive custom unit, When composed, Then excludes it', (inactive) => {
    const catalogue = createEffectiveUnitCatalogue({
      standard: createStandardUnitCatalogue(),
      custom: [inactive],
    });

    expect(catalogue.find(inactive.code)).toBeUndefined();
  });

  it('Given a custom code colliding with a standard code, When composed, Then rejects the catalogue', () => {
    expect(() =>
      createEffectiveUnitCatalogue({
        standard: createStandardUnitCatalogue(),
        custom: [createDefinition('UN/CEFACT:LTR')],
      }),
    ).toThrow(/present more than once/i);
  });

  it('Given a non-custom definition in the custom source, When composed, Then rejects the catalogue', () => {
    expect(() =>
      createEffectiveUnitCatalogue({
        standard: createStandardUnitCatalogue(),
        custom: [createDefinition('TANKOS:INVALID', 'active', 'si')],
      }),
    ).toThrow(/custom unit definitions/i);
  });

  function createDefinition(
    code: string,
    status: UnitDefinition['status'] = 'active',
    system: UnitDefinition['system'] = 'custom',
  ): UnitDefinition {
    return createUnitDefinition({
      code: createUnitCode(code),
      system,
      dimension: createDimensionSignature({ mass: 1 }),
      quantityKind: createQuantityKind('custom'),
      representation: createUnitRepresentation({
        symbol: 'u',
        asciiFallback: 'u',
        position: 'suffix',
        spacing: 'normal',
      }),
      conversionFamily: 'custom',
      catalogueVersion: 'custom-v1',
      status,
    });
  }
});
