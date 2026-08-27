import { signal, type Signal } from '@angular/core';

export type CrudListQueryParams = Readonly<
  Record<string, string | readonly string[] | null | undefined>
>;

export interface CrudListQueryCodec<TFilter> {
  readonly parse: (params: CrudListQueryParams) => TFilter;
  readonly serialize: (filter: TFilter) => CrudListQueryParams;
  readonly equals?: (left: TFilter, right: TFilter) => boolean;
}

export interface CrudListQueryStateOptions<TFilter> {
  readonly codec?: CrudListQueryCodec<TFilter>;
  readonly pageParam?: string;
}

/** Query state shared by paginated CRUD list screens.
 *
 * The codec keeps query parsing provider-neutral. A host router owns actual
 * navigation while this state owns equality, URL representation, and the
 * invariant that changing a filter resets pagination.
 */
export interface CrudListQueryState<TFilter> {
  readonly filter: Signal<TFilter>;
  readonly pageIndex: Signal<number>;
  readonly hasChanged: (filter: TFilter) => boolean;
  readonly setFilter: (filter: TFilter) => void;
  readonly setPage: (pageIndex: number) => void;
  readonly hydrate: (filter: TFilter, pageIndex: number) => void;
  readonly hydrateFromQuery: (params: CrudListQueryParams) => void;
  readonly toQueryParams: () => CrudListQueryParams;
}

export function createCrudListQueryState<TFilter>(
  initialFilter: TFilter,
  options: CrudListQueryStateOptions<TFilter> = {},
): CrudListQueryState<TFilter> {
  const filter = signal(initialFilter);
  const pageIndex = signal(0);
  const pageParam = options.pageParam ?? 'page';
  const equals = options.codec?.equals ?? Object.is;
  return {
    filter,
    pageIndex,
    hasChanged: (nextFilter) => !equals(filter(), nextFilter),
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
    hydrateFromQuery: (params) => {
      if (!options.codec) return;
      filter.set(options.codec.parse(params));
      pageIndex.set(normalizePageIndex(readPageParam(params[pageParam])));
    },
    toQueryParams: () => ({
      ...(options.codec?.serialize(filter()) ?? {}),
      [pageParam]: pageIndex() > 0 ? String(pageIndex()) : null,
    }),
  };
}

function readPageParam(
  value: string | readonly string[] | null | undefined,
): number {
  if (typeof value === 'string' || isNil(value)) {
    return Number(value ?? 0);
  }
  return Number(value[0] ?? 0);
}

function isNil(
  value: string | readonly string[] | null | undefined,
): value is null | undefined {
  return value === null || value === undefined;
}

function normalizePageIndex(pageIndex: number): number {
  return Number.isSafeInteger(pageIndex) && pageIndex > 0 ? pageIndex : 0;
}
