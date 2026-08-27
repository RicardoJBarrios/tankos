import { signal, type Signal } from '@angular/core';

/** Query state shared by paginated CRUD list screens.
 *
 * Changing the filter always returns to the first page. URL synchronisation is
 * deliberately left to the host so this state can be reused with any router.
 */
export interface CrudListQueryState<TFilter> {
  readonly filter: Signal<TFilter>;
  readonly pageIndex: Signal<number>;
  readonly setFilter: (filter: TFilter) => void;
  readonly setPage: (pageIndex: number) => void;
  readonly hydrate: (filter: TFilter, pageIndex: number) => void;
}

export function createCrudListQueryState<TFilter>(
  initialFilter: TFilter,
): CrudListQueryState<TFilter> {
  const filter = signal(initialFilter);
  const pageIndex = signal(0);
  return {
    filter,
    pageIndex,
    setFilter: (nextFilter) => {
      filter.set(nextFilter);
      pageIndex.set(0);
    },
    setPage: (nextPage) => {
      pageIndex.set(normalizePageIndex(nextPage));
    },
    hydrate: (nextFilter, nextPage) => {
      filter.set(nextFilter);
      pageIndex.set(normalizePageIndex(nextPage));
    },
  };
}

function normalizePageIndex(pageIndex: number): number {
  return Number.isSafeInteger(pageIndex) && pageIndex > 0 ? pageIndex : 0;
}
