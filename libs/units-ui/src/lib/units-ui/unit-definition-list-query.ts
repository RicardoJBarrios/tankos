import type { ParamMap } from '@angular/router';
import type {
  UnitDefinitionFilter,
  UnitDefinitionVisibility,
} from '@tankos/units';

export type UnitDefinitionVisibilityFilter =
  UnitDefinitionVisibility | 'deleted' | 'all';

export interface UnitDefinitionListQuery {
  readonly visibility: UnitDefinitionVisibilityFilter;
  readonly record: string;
  readonly owner: string;
}

export function parseUnitDefinitionListQuery(
  params: ParamMap,
): UnitDefinitionListQuery {
  return {
    visibility: parseVisibility(params.get('visibility')),
    record: params.get('record') ?? '',
    owner: params.get('owner') ?? '',
  };
}

export function unitDefinitionFilterFromQuery(
  query: UnitDefinitionListQuery,
  isAdmin: boolean,
): UnitDefinitionFilter {
  return {
    ...(query.visibility === 'public' || query.visibility === 'private'
      ? { visibility: query.visibility }
      : {}),
    ...(query.visibility === 'deleted'
      ? { lifecycle: 'marked-for-deletion' }
      : {}),
    ...(query.record.trim() ? { record: query.record.trim() } : {}),
    ...(isAdmin && query.owner.trim() ? { ownerName: query.owner.trim() } : {}),
  };
}

export function unitDefinitionListQueryParams(
  query: UnitDefinitionListQuery,
  pageIndex: number,
  isAdmin: boolean,
): Record<string, string | null> {
  return {
    visibility: query.visibility === 'all' ? null : query.visibility,
    record: query.record.trim() || null,
    owner: isAdmin ? query.owner.trim() || null : null,
    page: pageIndex > 0 ? String(pageIndex) : null,
  };
}

export function unitDefinitionListQueryKey(
  query: UnitDefinitionListQuery,
): string {
  return JSON.stringify({
    visibility: query.visibility,
    record: query.record.trim(),
    owner: query.owner.trim(),
  });
}

function parseVisibility(value: string | null): UnitDefinitionVisibilityFilter {
  return value && isUnitDefinitionVisibilityFilter(value) ? value : 'all';
}

export function isUnitDefinitionVisibilityFilter(
  value: string,
): value is UnitDefinitionVisibility | 'deleted' {
  return value === 'public' || value === 'private' || value === 'deleted';
}
