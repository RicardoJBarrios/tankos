import {
  DocumentData,
  Query,
  QueryConstraint,
  getDocs,
  limit,
  query,
  startAfter,
} from 'firebase/firestore';
import { Page, PageRequest, pageSizeFor } from '../application/pagination';

export async function readFirestorePage<
  T,
  Cursor extends string = string,
>(input: {
  readonly baseQuery: Query<DocumentData>;
  readonly request?: PageRequest;
  readonly decodeCursor: (cursor: string) => readonly unknown[];
  readonly encodeCursor: (item: T) => Cursor;
  readonly map: (document: {
    readonly id: string;
    readonly data: () => DocumentData;
  }) => T;
}): Promise<Page<T, Cursor>> {
  const pageSize = pageSizeFor(input.request);
  const constraints: QueryConstraint[] = [];
  if (input.request?.cursor) {
    constraints.push(startAfter(...input.decodeCursor(input.request.cursor)));
  }
  constraints.push(limit(pageSize + 1));
  const snapshot = await getDocs(query(input.baseQuery, ...constraints));
  const hasMore = snapshot.docs.length > pageSize;
  const items = snapshot.docs
    .slice(0, pageSize)
    .map((document) =>
      input.map({ id: document.id, data: () => document.data() }),
    );
  return {
    items,
    ...(hasMore && items.length > 0
      ? { nextCursor: input.encodeCursor(items[items.length - 1]) }
      : {}),
  };
}
