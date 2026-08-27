import { unitDefinitionSchema } from './unit-definition-zod-schema';

describe('unitDefinitionSchema', () => {
  const validDefinition = {
    code: 'UN/CEFACT:LTR',
    ownerName: 'Keeper One',
    visibility: 'public' as const,
    system: 'metric' as const,
    representation: {
      symbol: 'L',
      asciiFallback: 'L',
      position: 'suffix' as const,
      spacing: 'narrow' as const,
    },
    catalogueVersion: 'UN/CEFACT-Rev17-aquarium-core',
  };

  it('Given a valid DTO, When parsed, Then returns an immutable domain definition', () => {
    const result = unitDefinitionSchema.parse(validDefinition);

    expect(result.code).toBe('UN/CEFACT:LTR');
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.representation)).toBe(true);
  });

  it('omits the optional owner name when it is not provided', () => {
    const result = unitDefinitionSchema.parse({
      ...validDefinition,
      ownerName: undefined,
    });

    expect(result).not.toHaveProperty('ownerName');
  });

  it.each([
    null,
    undefined,
    { ...validDefinition, code: '' },
    { ...validDefinition, code: 'LTR' },
    { ...validDefinition, code: 'UN/CEFACT:LTR!' },
    {
      ...validDefinition,
      representation: { ...validDefinition.representation, symbol: ' ' },
    },
    {
      ...validDefinition,
      representation: { ...validDefinition.representation, asciiFallback: '' },
    },
    { ...validDefinition, extra: true },
  ])('Given an invalid DTO %s, When parsed, Then rejects it', (value) => {
    expect(unitDefinitionSchema.safeParse(value).success).toBe(false);
  });
});
