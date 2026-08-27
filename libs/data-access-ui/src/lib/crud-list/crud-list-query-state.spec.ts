import { describe, expect, it } from 'vitest';
import { createCrudListQueryState } from './crud-list-query-state';

describe('CrudListQueryState', () => {
  it('resets pagination when the filter changes', () => {
    const state = createCrudListQueryState({ search: '' });
    state.setPage(3);
    state.setFilter({ search: 'custom' });
    expect(state.filter()).toEqual({ search: 'custom' });
    expect(state.pageIndex()).toBe(0);
  });

  it('normalizes invalid pages when hydrated or changed', () => {
    const state = createCrudListQueryState({ search: '' });
    state.setPage(-1);
    expect(state.pageIndex()).toBe(0);
    state.hydrate({ search: 'unit' }, 2);
    expect(state.pageIndex()).toBe(2);
    state.hydrate({ search: 'unit' }, Number.NaN);
    expect(state.pageIndex()).toBe(0);
  });
});
