import {
  createUnitRepresentation,
  type UnitRepresentation,
} from './unit-representation';

describe('createUnitRepresentation', () => {
  it('Given scientific symbol metadata, When created, Then returns an immutable copy', () => {
    const input: UnitRepresentation = {
      symbol: 'L',
      asciiFallback: 'L',
      position: 'suffix',
      spacing: 'narrow',
    };

    const result = createUnitRepresentation(input);

    expect(result).toEqual(input);
    expect(result).not.toBe(input);
    expect(Object.isFrozen(result)).toBe(true);
  });

  it('Given an empty symbol, When representation is created, Then rejects it', () => {
    expect(() =>
      createUnitRepresentation({
        symbol: ' ',
        asciiFallback: 'L',
        position: 'suffix',
        spacing: 'narrow',
      }),
    ).toThrow('Unit representation symbol must be non-empty');
  });

  it.each([null, undefined, 'not-an-object'])(
    'Given a non-object representation (%s), When created, Then rejects it',
    (representation) => {
      expect(() => createUnitRepresentation(representation as never)).toThrow(
        'Unit representation must be an object',
      );
    },
  );

  it('Given an empty ASCII fallback, When representation is created, Then rejects it', () => {
    expect(() =>
      createUnitRepresentation({
        symbol: 'L',
        asciiFallback: ' ',
        position: 'suffix',
        spacing: 'narrow',
      }),
    ).toThrow('Unit representation ASCII fallback must be non-empty');
  });

  it('Given invalid placement or spacing, When representation is created, Then rejects it', () => {
    expect(() =>
      createUnitRepresentation({
        symbol: 'L',
        asciiFallback: 'L',
        position: 'middle' as never,
        spacing: 'narrow',
      }),
    ).toThrow('Unit representation position is invalid');
    expect(() =>
      createUnitRepresentation({
        symbol: 'L',
        asciiFallback: 'L',
        position: 'suffix',
        spacing: 'wide' as never,
      }),
    ).toThrow('Unit representation spacing is invalid');
  });

  it('Given mutable input, When representation is created, Then returns an immutable copy', () => {
    const input = {
      symbol: 'L',
      asciiFallback: 'L',
      position: 'suffix' as const,
      spacing: 'narrow' as const,
    };
    const result = createUnitRepresentation(input);

    input.symbol = 'changed';
    expect(result.symbol).toBe('L');
    expect(Object.isFrozen(result)).toBe(true);
  });
});
