import { createStandardConversionDefinitions } from './standard-conversion-definitions';

describe('createStandardConversionDefinitions', () => {
  it('Given the standard conversion adapter, When definitions are requested, Then returns the declared aquarium-first conversion set', () => {
    const definitions = createStandardConversionDefinitions();

    expect(definitions.map((definition) => definition.code)).toEqual([
      'volume-litre-to-millilitre',
      'volume-millilitre-to-litre',
      'length-metre-to-centimetre',
      'length-centimetre-to-metre',
      'mass-kilogram-to-gram',
      'mass-gram-to-kilogram',
      'temperature-celsius-to-kelvin',
      'temperature-kelvin-to-celsius',
      'temperature-celsius-to-fahrenheit',
      'temperature-fahrenheit-to-celsius',
      'pressure-bar-to-pascal',
      'pressure-pascal-to-bar',
    ]);
    expect(Object.isFrozen(definitions)).toBe(true);
    expect(
      definitions.every((definition) => definition.origin === 'standard'),
    ).toBe(true);
  });

  it('Given the Fahrenheit to Celsius definition, When inspected, Then retains its exact rational offset', () => {
    const definition = createStandardConversionDefinitions().find(
      (candidate) => candidate.code === 'temperature-fahrenheit-to-celsius',
    );

    expect(definition?.offset).toEqual({ numerator: '-160', denominator: '9' });
  });
});
