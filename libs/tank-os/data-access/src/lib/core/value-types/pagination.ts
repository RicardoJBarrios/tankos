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
export function createPageRequest(
  request: PageRequest,
): PageRequest {
  if (!request || typeof request !== 'object') {
    throw new TypeError('Page request must be an object');
  }
  if (!Number.isInteger(request.pageSize) || request.pageSize < 1 || request.pageSize > 500) {
    throw new RangeError('Page size must be an integer between 1 and 500');
  }
  if (!Array.isArray(request.orderBy) || request.orderBy.length === 0) {
    throw new TypeError('Page ordering must contain at least one field');
  }
  if (
    request.orderBy.some(
      (item) =>
        !item ||
        typeof item.field !== 'string' ||
        !item.field.trim() ||
        (item.direction !== 'asc' && item.direction !== 'desc'),
    )
  ) {
    throw new TypeError('Page ordering fields must be non-empty');
  }
  const fields = request.orderBy.map((item) => item.field);
  if (new Set(fields).size !== fields.length) {
    throw new TypeError('Page ordering fields must be unique');
  }
  return request;
}
