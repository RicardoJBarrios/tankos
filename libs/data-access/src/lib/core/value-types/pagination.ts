import type { PageCursor } from './page-cursor';

/** Direction of a stable repository ordering. */
export type SortDirection = 'asc' | 'desc';

/** One field participating in a deterministic page ordering. */
export interface OrderBy {
  readonly field: string;
  readonly direction: SortDirection;
}

/** Bounded request for a cursor-based page. */
export interface PageRequest {
  readonly pageSize: number;
  readonly after?: PageCursor;
  readonly orderBy: readonly OrderBy[];
}

/** Result of a cursor-based page query. */
export interface Page<TRecord> {
  readonly items: readonly TRecord[];
  readonly nextCursor?: PageCursor;
  readonly hasMore: boolean;
}

/** Validates a bounded cursor page request before it reaches a provider. */
export function createPageRequest(request: unknown): PageRequest {
  if (!request || typeof request !== 'object') {
    throw new TypeError('Page request must be an object');
  }
  const candidate = request as {
    readonly pageSize?: unknown;
    readonly orderBy?: unknown;
  };
  if (!isValidPageSizeValue(candidate.pageSize)) {
    throw new RangeError('Page size must be an integer between 1 and 500');
  }
  if (!Array.isArray(candidate.orderBy) || candidate.orderBy.length === 0) {
    throw new TypeError('Page ordering must contain at least one field');
  }
  const orderBy = candidate.orderBy.filter(isOrderBy);
  if (orderBy.length !== candidate.orderBy.length) {
    throw new TypeError('Page ordering fields must be non-empty');
  }
  const fields = orderBy.map((item) => item.field);
  if (new Set(fields).size !== fields.length) {
    throw new TypeError('Page ordering fields must be unique');
  }
  return request as PageRequest;
}

function isValidPageSizeValue(value: unknown): value is number {
  return typeof value === 'number' && isValidPageSize(value);
}

function isOrderBy(value: unknown): value is OrderBy {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as {
    readonly field?: unknown;
    readonly direction?: unknown;
  };
  if (
    typeof candidate.field !== 'string' ||
    candidate.field.trim().length === 0
  )
    return false;
  return candidate.direction === 'asc' || candidate.direction === 'desc';
}

function isValidPageSize(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= 500;
}
