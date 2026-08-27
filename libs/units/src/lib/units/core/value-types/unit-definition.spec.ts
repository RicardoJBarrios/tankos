import { createUnitDefinition, type UnitDefinition } from './unit-definition';
import { createUnitCode } from './unit-code';
import { createUnitRepresentation } from './unit-representation';

describe('createUnitDefinition', () => {
  it('Given a complete definition, When created, Then returns an immutable copy', () => {
    const input: UnitDefinition = {
      code: createUnitCode('UN/CEFACT:LTR'),
      ownerName: 'Keeper One',
      visibility: 'public',
      system: 'si',
      representation: createUnitRepresentation({
        symbol: 'L',
        asciiFallback: 'L',
        position: 'suffix',
        spacing: 'narrow',
      }),
      catalogueVersion: 'UN/CEFACT-Rev17',
    };

    const result = createUnitDefinition(input);

    expect(result).toEqual(input);
    expect(result).not.toBe(input);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.representation)).toBe(true);
  });

  it('Given an empty catalogue version, When created, Then rejects it', () => {
    const definition = createDefinition();

    expect(() =>
      createUnitDefinition({ ...definition, catalogueVersion: '' }),
    ).toThrow('Unit catalogue version must be non-empty');
  });

  it('normalizes omitted visibility to public and rejects private definitions without an owner', () => {
    const definition = createDefinition();
    const publicDefinition = createUnitDefinition({
      ...definition,
      visibility: undefined,
    });
    expect(publicDefinition.visibility).toBe('public');
    expect(() =>
      createUnitDefinition({ ...definition, visibility: 'private' }),
    ).toThrow('Private unit definitions require an owner');
  });

  it('Given an invalid system or visibility, When created, Then rejects it', () => {
    const definition = createDefinition();

    expect(() =>
      createUnitDefinition({ ...definition, system: 'unknown' as never }),
    ).toThrow('Unit definition system is invalid');
    expect(() =>
      createUnitDefinition({ ...definition, visibility: 'unknown' as never }),
    ).toThrow('Unit definition visibility is invalid');
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
      visibility: 'public',
      system: 'si',
      representation: createUnitRepresentation({
        symbol: 'L',
        asciiFallback: 'L',
        position: 'suffix',
        spacing: 'narrow',
      }),
      catalogueVersion: 'UN/CEFACT-Rev17',
    };
  }
});
