import type { Query, QueryConstraint } from 'firebase/firestore';
import type { ListRequest, PageCursor } from '@tankos/data-access';

export type FirestoreCursorAdapter<TFilter> = (
  builtQuery: Query,
  cursor: PageCursor,
  request: ListRequest<TFilter>,
) => QueryConstraint;

/** Converts the opaque repository cursor into a provider query constraint. */
export function createFirestoreCursorConstraint<TFilter>(
  builtQuery: Query,
  request: ListRequest<TFilter>,
  cursorAdapter?: FirestoreCursorAdapter<TFilter>,
): QueryConstraint | undefined {
  if (!request.page.after) return undefined;
  if (!cursorAdapter)
    throw new TypeError(
      'Firestore repository requires a cursor adapter for subsequent pages',
    );
  return cursorAdapter(builtQuery, request.page.after, request);
}
