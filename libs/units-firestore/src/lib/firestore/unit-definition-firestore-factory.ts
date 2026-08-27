import {
  startAfter,
  type Firestore,
  type QueryDocumentSnapshot,
} from 'firebase/firestore';
import { createPageCursor, type PageCursor } from '@tankos/data-access';
import type { ClockPort } from '@tankos/time';
import {
  createUnitDefinitionFirestoreRepository,
  type UnitDefinitionFirestoreRepositoryOptions,
} from './unit-definition-firestore-repository';
import { authorizeUnitDefinitionOperation } from './unit-definition-firestore-authorization';
import {
  createUnitDefinitionId,
  createUnitDefinitionReplacementId,
} from './unit-definition-id-policy';
import { buildUnitDefinitionQuery } from './unit-definition-query-builder';

export interface UnitDefinitionFirestoreFactoryOptions {
  readonly firestore: Firestore;
  readonly clock: ClockPort;
}

/** Creates the canonical Firestore adapter for the unit-definition catalogue. */
export function createDefaultUnitDefinitionFirestoreRepository(
  options: UnitDefinitionFirestoreFactoryOptions,
): ReturnType<typeof createUnitDefinitionFirestoreRepository> {
  const repositoryOptions: UnitDefinitionFirestoreRepositoryOptions = {
    firestore: options.firestore,
    collectionPath: 'units',
    clock: options.clock,
    createId: createUnitDefinitionId,
    createReplacementId: createUnitDefinitionReplacementId,
    buildQuery: buildUnitDefinitionQuery,
    encodeCursor: encodeUnitDefinitionCursor,
    applyCursor: (builtQuery, cursor) => {
      const decoded = parseUnitDefinitionCursor(cursor);
      return startAfter(decoded.code, decoded.id);
    },
    authorize: authorizeUnitDefinitionOperation,
  };
  return createUnitDefinitionFirestoreRepository(repositoryOptions);
}

function encodeUnitDefinitionCursor(
  snapshot: QueryDocumentSnapshot,
): PageCursor {
  const value = snapshot.data() as { readonly data: { readonly code: string } };
  return createPageCursor(
    JSON.stringify({ code: value.data.code, id: snapshot.id }),
  );
}

interface UnitDefinitionCursor {
  readonly code: string;
  readonly id: string;
}

function parseUnitDefinitionCursor(cursor: string): UnitDefinitionCursor {
  try {
    const value: unknown = JSON.parse(cursor);
    if (isUnitDefinitionCursor(value)) return value;
  } catch {
    // The cursor is untrusted input and is reported as a validation failure.
  }
  throw new TypeError('Invalid unit-definition page cursor');
}

function isUnitDefinitionCursor(value: unknown): value is UnitDefinitionCursor {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate['code'] === 'string' &&
    candidate['code'].length > 0 &&
    typeof candidate['id'] === 'string' &&
    candidate['id'].length > 0
  );
}
