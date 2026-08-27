import {
  createUnitCode,
  createUnitDefinition,
  createUnitRepresentation,
} from '@tankos/units';
import { unitDefinitionSchema } from './unit-definition-zod-schema';
import { unitDefinitionToDto } from './unit-definition-zod-mapper';

describe('unitDefinitionToDto', () => {
  it('Given a domain unit definition, When serialized, Then produces a DTO accepted by the schema', () => {
    const definition = createUnitDefinition({
      code: createUnitCode('UN/CEFACT:LTR'),
      ownerId: 'keeper-1',
      ownerName: 'Keeper One',
      visibility: 'private',
      system: 'metric',
      representation: createUnitRepresentation({
        symbol: 'L',
        asciiFallback: 'L',
        position: 'suffix',
        spacing: 'narrow',
      }),
      catalogueVersion: 'v1',
    });

    const dto = unitDefinitionToDto(definition);

    expect(dto).toEqual(expect.objectContaining({ code: 'UN/CEFACT:LTR' }));
    expect(unitDefinitionSchema.parse(dto)).toEqual(definition);
  });

  it('serializes standard definitions as public without an owner', () => {
    const definition = createUnitDefinition({
      code: createUnitCode('UN/CEFACT:LTR'),
      system: 'metric',
      representation: createUnitRepresentation({
        symbol: 'L',
        asciiFallback: 'L',
        position: 'suffix',
        spacing: 'narrow',
      }),
      catalogueVersion: 'v1',
      visibility: 'public',
    });

    expect(unitDefinitionToDto(definition)).not.toHaveProperty('ownerId');
    expect(unitDefinitionToDto(definition).visibility).toBe('public');
  });
});
