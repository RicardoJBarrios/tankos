import { createConversionDefinition } from './conversion-definition';
import { createUnitCode } from './unit-code';

describe('createConversionDefinition', () => {
  const base = {
    sourceUnit: createUnitCode('UN/CEFACT:LTR'),
    targetUnit: createUnitCode('UN/CEFACT:MLT'),
    code: 'volume-litre-to-millilitre',
    version: '1',
    origin: 'standard' as const,
    family: 'volume',
    kind: 'linear' as const,
    factor: { numerator: '1000', denominator: '1' },
    offset: '0',
    provenance: 'test',
  };

  it('Given a valid definition, When created, Then canonicalizes decimal fields and freezes the definition', () => {
    const result = createConversionDefinition({
      ...base,
      factor: { numerator: '001000', denominator: 1 },
      offset: '0.00',
    });

    expect(result.factor).toEqual({ numerator: '1000', denominator: '1' });
    expect(result.offset).toBe('0');
    expect(Object.isFrozen(result)).toBe(true);
    expect(Object.isFrozen(result.factor)).toBe(true);
  });

  it.each([
    { code: '', version: '1' },
    { code: 'code', version: '' },
    { code: ' ', version: '1' },
    { code: 'code', version: ' ' },
  ])(
    'Given missing code metadata %s, When created, Then rejects it',
    (metadata) => {
      expect(() =>
        createConversionDefinition({ ...base, ...metadata }),
      ).toThrow(TypeError);
    },
  );

  it.each([
    { family: '', provenance: 'test' },
    { family: 'volume', provenance: '' },
  ])(
    'Given missing provenance metadata %s, When created, Then rejects it',
    (metadata) => {
      expect(() =>
        createConversionDefinition({ ...base, ...metadata }),
      ).toThrow(TypeError);
    },
  );

  it('Given a zero denominator, When created, Then rejects the conversion', () => {
    expect(() =>
      createConversionDefinition({
        ...base,
        factor: { numerator: 1, denominator: '0' },
      }),
    ).toThrow(TypeError);
  });

  it('Given an invalid origin, When created, Then rejects the definition', () => {
    expect(() =>
      createConversionDefinition({ ...base, origin: 'unknown' as never }),
    ).toThrow(TypeError);
  });
});
