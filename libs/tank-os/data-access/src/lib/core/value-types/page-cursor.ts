/** Opaque cursor returned by a paginated repository. */
export type PageCursor = string & { readonly __pageCursor: unique symbol };

/** Creates a cursor without interpreting provider-specific cursor contents. */
export function createPageCursor(value: string): PageCursor {
  if (typeof value !== 'string' || !value.trim()) {
    throw new TypeError('Page cursor must be a non-empty string');
  }

  return value as PageCursor;
}
