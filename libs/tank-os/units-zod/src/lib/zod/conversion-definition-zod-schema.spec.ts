import { conversionDefinitionSchema } from './conversion-definition-zod-schema';

describe('conversionDefinitionSchema', () => {
  const validDefinition = {
    code: 'volume-ltr-mlt',
    version: '1',
    origin: 'custom' as const,
    sourceUnit: 'UN/CEFACT:LTR',
    targetUnit: 'UN/CEFACT:MLT',
    family: 'volume',
    kind: 'linear' as const,
    factor: { numerator: '1000', denominator: 1 },
    offset: '0',
    divisionContext: { decimalPlaces: 4, rounding: 'half-up' as const },
    provenance: 'UN/CEFACT-Rev17-aquarium-core',
  };

  it('Given a valid DTO, When parsed, Then returns canonical immutable conversion data', () => {
    const result = conversionDefinitionSchema.parse(validDefinition);

    expect(result.factor).toEqual({ numerator: '1000', denominator: '1' });
    expect(result.offset).toBe('0');
    expect(result.sourceUnit).toBe('UN/CEFACT:LTR');
    expect(result.divisionContext).toEqual({
      decimalPlaces: 4,
      rounding: 'half-up',
    });
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.factor)).toBe(true);
    expect(Object.isFrozen(result.divisionContext)).toBe(true);
  });

  it('Given a rational offset DTO, When parsed, Then preserves its canonical factor', () => {
    const result = conversionDefinitionSchema.parse({
      ...validDefinition,
      kind: 'affine',
      offset: { numerator: 32, denominator: 1 },
    });

    expect(result.offset).toEqual({ numerator: '32', denominator: '1' });
  });

  it('Given a DTO without a division context, When parsed, Then leaves the context absent', () => {
    const withoutContext = { ...validDefinition, divisionContext: undefined };

    expect(
      conversionDefinitionSchema.parse(withoutContext).divisionContext,
    ).toBeUndefined();
  });

  it.each([
    null,
    undefined,
    { ...validDefinition, code: ' ' },
    { ...validDefinition, version: '' },
    { ...validDefinition, family: ' ' },
    { ...validDefinition, provenance: '' },
    { ...validDefinition, sourceUnit: 'LTR' },
    { ...validDefinition, factor: { numerator: 1, denominator: 0 } },
    { ...validDefinition, factor: { numerator: NaN, denominator: 1 } },
    { ...validDefinition, factor: { numerator: '1,2', denominator: 1 } },
    { ...validDefinition, factor: { numerator: ' ', denominator: 1 } },
    { ...validDefinition, factor: { numerator: Infinity, denominator: 1 } },
    {
      ...validDefinition,
      divisionContext: { decimalPlaces: -1, rounding: 'down' },
    },
    { ...validDefinition, extra: true },
  ])('Given an invalid DTO %s, When parsed, Then rejects it', (value) => {
    expect(conversionDefinitionSchema.safeParse(value).success).toBe(false);
  });
});
