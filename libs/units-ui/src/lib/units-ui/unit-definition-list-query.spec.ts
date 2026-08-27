import type { ParamMap } from '@angular/router';
import { describe, expect, it } from 'vitest';
import {
  isUnitDefinitionVisibilityFilter,
  parseUnitDefinitionListQuery,
  unitDefinitionFilterFromQuery,
  unitDefinitionListQueryKey,
  unitDefinitionListQueryParams,
} from './unit-definition-list-query';

describe('unit definition list query', () => {
  it('hydrates valid query parameters and defaults invalid values', () => {
    expect(
      parseUnitDefinitionListQuery(
        createParamMap({
          visibility: 'private',
          record: 'BAR',
          owner: 'keeper',
        }),
      ),
    ).toEqual({ visibility: 'private', record: 'BAR', owner: 'keeper' });
    expect(
      parseUnitDefinitionListQuery(createParamMap({ visibility: 'invalid' })),
    ).toEqual({ visibility: 'all', record: '', owner: '' });
  });

  it('maps filters and trims values according to the caller role', () => {
    expect(
      unitDefinitionFilterFromQuery(
        { visibility: 'deleted', record: ' BAR ', owner: ' keeper ' },
        true,
      ),
    ).toEqual({
      lifecycle: 'marked-for-deletion',
      record: 'BAR',
      ownerName: 'keeper',
    });
    expect(
      unitDefinitionFilterFromQuery(
        { visibility: 'all', record: ' BAR ', owner: 'keeper' },
        false,
      ),
    ).toEqual({ record: 'BAR' });
    expect(
      unitDefinitionFilterFromQuery(
        { visibility: 'public', record: '', owner: 'keeper' },
        true,
      ),
    ).toEqual({ visibility: 'public', ownerName: 'keeper' });
  });

  it('serializes filters and page state for stable links', () => {
    const query = {
      visibility: 'public' as const,
      record: ' BAR ',
      owner: ' ',
    };
    expect(unitDefinitionListQueryParams(query, 2, false)).toEqual({
      visibility: 'public',
      record: 'BAR',
      owner: null,
      page: '2',
    });
    expect(unitDefinitionListQueryKey(query)).toBe(
      '{"visibility":"public","record":"BAR","owner":""}',
    );
    expect(
      unitDefinitionListQueryParams(
        { visibility: 'all', record: '', owner: 'keeper' },
        0,
        true,
      ),
    ).toEqual({ visibility: null, record: null, owner: 'keeper', page: null });
    expect(
      unitDefinitionListQueryParams(
        { visibility: 'all', record: '', owner: '' },
        0,
        true,
      ).owner,
    ).toBeNull();
  });

  it('recognizes only supported visibility filters', () => {
    expect(isUnitDefinitionVisibilityFilter('public')).toBe(true);
    expect(isUnitDefinitionVisibilityFilter('deleted')).toBe(true);
    expect(isUnitDefinitionVisibilityFilter('all')).toBe(false);
  });
});

function createParamMap(values: Record<string, string>): ParamMap {
  return {
    get: (name) => values[name] ?? null,
  } as ParamMap;
}
