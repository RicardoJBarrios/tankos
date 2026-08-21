import { createUnitCode } from '../../core';
import { createStandardUnitCatalogue } from './standard-unit-catalogue';

describe('createStandardUnitCatalogue', () => {
  it('Given the standard catalogue, When listed, Then returns the immutable aquarium-first definitions in code order', () => {
    const catalogue = createStandardUnitCatalogue();
    const units = catalogue.list();

    expect(units.length).toBe(13);
    expect(units.map((unit) => unit.code)).toEqual([
      'UN/CEFACT:BAR',
      'UN/CEFACT:CEL',
      'UN/CEFACT:CMT',
      'UN/CEFACT:FAH',
      'UN/CEFACT:GLI',
      'UN/CEFACT:GLL',
      'UN/CEFACT:GRM',
      'UN/CEFACT:KEL',
      'UN/CEFACT:KGM',
      'UN/CEFACT:LTR',
      'UN/CEFACT:MLT',
      'UN/CEFACT:MTR',
      'UN/CEFACT:PAL',
    ]);
    expect(Object.isFrozen(units)).toBe(true);
  });

  it('Given a qualified standard code, When resolved, Then returns its immutable definition', () => {
    const unit = createStandardUnitCatalogue().find(
      createUnitCode('UN/CEFACT:LTR'),
    );

    expect(unit).toMatchObject({
      code: 'UN/CEFACT:LTR',
      quantityKind: 'volume',
      conversionFamily: 'volume',
      catalogueVersion: 'UN/CEFACT-Rev17-aquarium-core',
      status: 'active',
    });
    expect(Object.isFrozen(unit)).toBe(true);
  });

  it('Given an unknown qualified code, When resolved, Then returns undefined', () => {
    expect(
      createStandardUnitCatalogue().find(createUnitCode('UN/CEFACT:UNKNOWN')),
    ).toBeUndefined();
  });
});
