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

  it('serializes and hydrates through a provider-neutral query codec', () => {
    const state = createCrudListQueryState(
      { search: '' },
      {
        codec: {
          parse: (params) => ({ search: String(params.search ?? '') }),
          serialize: (filter) => ({ search: filter.search || null }),
          equals: (left, right) => left.search === right.search,
        },
      },
    );

    state.setFilter({ search: 'bar' });
    state.setPage(2);
    expect(state.toQueryParams()).toEqual({ search: 'bar', page: '2' });
    expect(state.hasChanged({ search: 'bar' })).toBe(false);
    expect(state.hasChanged({ search: 'foo' })).toBe(true);

    state.hydrateFromQuery({ search: 'foo', page: ['4'] });
    expect(state.filter()).toEqual({ search: 'foo' });
    expect(state.pageIndex()).toBe(4);

    state.hydrateFromQuery({ search: 'foo', page: '3' });
    expect(state.pageIndex()).toBe(3);

    state.hydrateFromQuery({ search: 'foo', page: [] });
    expect(state.pageIndex()).toBe(0);

    state.hydrateFromQuery({ search: 'foo', page: null });
    expect(state.pageIndex()).toBe(0);

    state.hydrateFromQuery({ search: 'foo' });
    expect(state.pageIndex()).toBe(0);
  });

  it('does not hydrate from query without a codec', () => {
    const state = createCrudListQueryState({ search: '' });
    state.hydrateFromQuery({ search: 'ignored', page: '4' });
    expect(state.filter()).toEqual({ search: '' });
    expect(state.pageIndex()).toBe(0);
    expect(state.toQueryParams()).toEqual({ page: null });
  });
});
