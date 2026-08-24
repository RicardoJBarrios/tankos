import { createConversionDefinition, createUnitCode } from '@tankos/units';
import { createDecimalContext } from '@tankos/decimal';
import { conversionDefinitionSchema } from './conversion-definition-zod-schema';
import { conversionDefinitionToDto } from './conversion-definition-zod-mapper';

describe('conversionDefinitionToDto', () => {
  it('Given a domain conversion, When serialized, Then produces a DTO accepted by the schema', () => {
    const definition = createConversionDefinition({
      code: 'TANKOS:CUSTOM-LTR-MLT',
      version: '1',
      origin: 'custom',
      sourceUnit: createUnitCode('UN/CEFACT:LTR'),
      targetUnit: createUnitCode('UN/CEFACT:MLT'),
      family: 'volume',
      kind: 'linear',
      factor: { numerator: '1000', denominator: '1' },
      offset: { numerator: '0', denominator: '1' },
      divisionContext: createDecimalContext(2, 'half-up'),
      provenance: 'test',
    });

    const dto = conversionDefinitionToDto(definition);

    expect(dto).toEqual(expect.objectContaining({ origin: 'custom' }));
    expect(conversionDefinitionSchema.parse(dto)).toEqual(definition);
  });

  it('Given a conversion without a division context, When serialized, Then omits the optional context', () => {
    const definition = createConversionDefinition({
      code: 'TANKOS:CUSTOM-LTR-MLT',
      version: '1',
      origin: 'custom',
      sourceUnit: createUnitCode('UN/CEFACT:LTR'),
      targetUnit: createUnitCode('UN/CEFACT:MLT'),
      family: 'volume',
      kind: 'linear',
      factor: { numerator: '1000', denominator: '1' },
      offset: '0',
      provenance: 'test',
    });

    expect(
      conversionDefinitionToDto(definition).divisionContext,
    ).toBeUndefined();
  });
});
