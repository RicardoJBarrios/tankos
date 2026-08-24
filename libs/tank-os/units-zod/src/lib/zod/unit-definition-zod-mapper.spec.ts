import {
  createDimensionSignature,
  createQuantityKind,
  createUnitCode,
  createUnitDefinition,
  createUnitRepresentation,
} from '@tank-os/units';
import { unitDefinitionSchema } from './unit-definition-zod-schema';
import { unitDefinitionToDto } from './unit-definition-zod-mapper';

describe('unitDefinitionToDto', () => {
  it('Given a domain unit definition, When serialized, Then produces a DTO accepted by the schema', () => {
    const definition = createUnitDefinition({
      code: createUnitCode('UN/CEFACT:LTR'),
      system: 'metric',
      dimension: createDimensionSignature({ length: 3 }),
      quantityKind: createQuantityKind('volume'),
      representation: createUnitRepresentation({
        symbol: 'L',
        asciiFallback: 'L',
        position: 'suffix',
        spacing: 'narrow',
      }),
      conversionFamily: 'volume',
      catalogueVersion: 'v1',
      status: 'active',
    });

    const dto = unitDefinitionToDto(definition);

    expect(dto).toEqual(expect.objectContaining({ code: 'UN/CEFACT:LTR' }));
    expect(unitDefinitionSchema.parse(dto)).toEqual(definition);
  });
});
