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
});
