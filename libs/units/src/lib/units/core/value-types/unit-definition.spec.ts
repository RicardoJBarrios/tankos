import { createDimensionSignature } from './dimension-signature';
import { createQuantityKind } from './quantity-kind';
import { createUnitDefinition, type UnitDefinition } from './unit-definition';
import { createUnitCode } from './unit-code';
import { createUnitRepresentation } from './unit-representation';

describe('createUnitDefinition', () => {
  it('Given a complete definition, When created, Then returns an immutable copy', () => {
    const input: UnitDefinition = {
      code: createUnitCode('UN/CEFACT:LTR'),
      system: 'si',
      dimension: createDimensionSignature({ length: 3 }),
      quantityKind: createQuantityKind('volume'),
      representation: createUnitRepresentation({
        symbol: 'L',
        asciiFallback: 'L',
        position: 'suffix',
        spacing: 'narrow',
      }),
      conversionFamily: 'volume',
      catalogueVersion: 'UN/CEFACT-Rev17',
      status: 'active',
    };

    const result = createUnitDefinition(input);

    expect(result).toEqual(input);
    expect(result).not.toBe(input);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.dimension)).toBe(true);
    expect(Object.isFrozen(result.representation)).toBe(true);
  });

  it('Given an empty conversion family or catalogue version, When created, Then rejects it', () => {
    const definition = createDefinition();

    expect(() =>
      createUnitDefinition({ ...definition, conversionFamily: ' ' }),
    ).toThrow('Unit conversion family must be non-empty');
    expect(() =>
      createUnitDefinition({ ...definition, catalogueVersion: '' }),
    ).toThrow('Unit catalogue version must be non-empty');
  });

  it('Given an invalid system or lifecycle status, When created, Then rejects it', () => {
    const definition = createDefinition();

    expect(() =>
      createUnitDefinition({ ...definition, system: 'unknown' as never }),
    ).toThrow('Unit definition system is invalid');
    expect(() =>
      createUnitDefinition({ ...definition, status: 'unknown' as never }),
    ).toThrow('Unit definition status is invalid');
  });

  it.each([null, undefined, 'not-an-object'])(
    'Given a non-object definition (%s), When created, Then rejects it',
    (definition) => {
      expect(() => createUnitDefinition(definition as never)).toThrow(
        'Unit definition must be an object',
      );
    },
  );

  function createDefinition(): UnitDefinition {
    return {
      code: createUnitCode('UN/CEFACT:LTR'),
      system: 'si',
      dimension: createDimensionSignature({ length: 3 }),
      quantityKind: createQuantityKind('volume'),
      representation: createUnitRepresentation({
        symbol: 'L',
        asciiFallback: 'L',
        position: 'suffix',
        spacing: 'narrow',
      }),
      conversionFamily: 'volume',
      catalogueVersion: 'UN/CEFACT-Rev17',
      status: 'active',
    };
  }
});
