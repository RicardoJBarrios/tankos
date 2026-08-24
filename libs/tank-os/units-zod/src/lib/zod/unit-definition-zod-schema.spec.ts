import { unitDefinitionSchema } from './unit-definition-zod-schema';

describe('unitDefinitionSchema', () => {
  const validDefinition = {
    code: 'UN/CEFACT:LTR',
    system: 'metric' as const,
    dimension: {
      length: 3,
      mass: 0,
      time: 0,
      temperature: 0,
      amountOfSubstance: 0,
      electricCurrent: 0,
      luminousIntensity: 0,
    },
    quantityKind: 'volume',
    representation: {
      symbol: 'L',
      asciiFallback: 'L',
      position: 'suffix' as const,
      spacing: 'narrow' as const,
    },
    conversionFamily: 'volume',
    catalogueVersion: 'UN/CEFACT-Rev17-aquarium-core',
    status: 'active' as const,
  };

  it('Given a valid DTO, When parsed, Then returns an immutable domain definition', () => {
    const result = unitDefinitionSchema.parse(validDefinition);

    expect(result.code).toBe('UN/CEFACT:LTR');
    expect(result.dimension).toEqual(validDefinition.dimension);
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.dimension)).toBe(true);
    expect(Object.isFrozen(result.representation)).toBe(true);
  });

  it.each([
    null,
    undefined,
    { ...validDefinition, code: '' },
    { ...validDefinition, code: 'LTR' },
    { ...validDefinition, code: 'UN/CEFACT:LTR!' },
    { ...validDefinition, quantityKind: ' ' },
    { ...validDefinition, dimension: { ...validDefinition.dimension, mass: 1.5 } },
    { ...validDefinition, representation: { ...validDefinition.representation, symbol: ' ' } },
    { ...validDefinition, representation: { ...validDefinition.representation, asciiFallback: '' } },
    { ...validDefinition, extra: true },
  ])('Given an invalid DTO %s, When parsed, Then rejects it', (value) => {
    expect(unitDefinitionSchema.safeParse(value).success).toBe(false);
  });
});
