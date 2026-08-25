export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;

export interface PageRequest {
  readonly cursor?: string;
  readonly pageSize?: number;
}

export interface Page<T, Cursor extends string = string> {
  readonly items: readonly T[];
  readonly nextCursor?: Cursor;
}

export function pageSizeFor(request?: PageRequest): number {
  const requested = request?.pageSize ?? DEFAULT_PAGE_SIZE;
  if (!Number.isInteger(requested) || requested < 1) {
    return DEFAULT_PAGE_SIZE;
  }
  return Math.min(requested, MAX_PAGE_SIZE);
}
