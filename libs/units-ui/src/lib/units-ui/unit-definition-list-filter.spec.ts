import {
  createUnitCode,
  createUnitDefinition,
  createUnitRepresentation,
} from '@tankos/units';
import { describe, expect, it } from 'vitest';
import { filterUnitDefinitionItems } from './unit-definition-list-filter';

const publicUnit = createUnitDefinition({
  code: createUnitCode('TANKOS:CUSTOM'),
  visibility: 'public',
  system: 'custom',
  representation: createUnitRepresentation({
    symbol: 'u',
    asciiFallback: 'u',
    position: 'suffix',
    spacing: 'normal',
  }),
  catalogueVersion: 'v1',
});

const privateUnit = createUnitDefinition({
  ...publicUnit,
  code: createUnitCode('TANKOS:PRIVATE'),
  visibility: 'private',
  ownerId: 'keeper-1',
  ownerName: 'Developer Local',
});

const records = [
  { id: 'public', data: publicUnit },
  { id: 'private', data: privateUnit },
] as never;

describe('filterUnitDefinitionItems', () => {
  it('returns all items without a filter', () => {
    expect(filterUnitDefinitionItems(records, undefined)).toHaveLength(2);
    expect(filterUnitDefinitionItems(records, {})).toHaveLength(2);
  });

  it('matches code and owner name case-insensitively by substring', () => {
    expect(filterUnitDefinitionItems(records, { record: 'custom' })).toEqual([
      records[0],
    ]);
    expect(filterUnitDefinitionItems(records, { ownerName: 'local' })).toEqual([
      records[1],
    ]);
  });

  it('combines record and owner filters', () => {
    expect(
      filterUnitDefinitionItems(records, {
        record: 'private',
        ownerName: 'developer',
      }),
    ).toEqual([records[1]]);
  });
});
