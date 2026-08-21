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
  });
});
