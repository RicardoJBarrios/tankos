import {
  orderBy,
  query,
  type CollectionReference,
  type Firestore,
} from 'firebase/firestore';
import { createPageCursor } from '@tankos/data-access';
import type { ClockPort } from '@tankos/time';
import type { UnitDefinition } from '@tankos/units';
import {
  createUnitDefinitionFirestoreRepository,
  type UnitDefinitionFirestoreRepositoryOptions,
} from './unit-definition-firestore-repository';

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
    createId: (input: UnitDefinition, access) => {
      const code = String(input.code)
        .replace(/[^0-9A-Za-z]+/gu, '-')
        .toLowerCase();
      const replacement = access?.requestId
        ?.replace(/[^0-9A-Za-z]+/gu, '-')
        .toLowerCase();
      return replacement ? `${code}-${replacement}` : code;
    },
    buildQuery: (reference: CollectionReference) =>
      query(reference, orderBy('data.code', 'asc')),
    encodeCursor: (snapshot) => createPageCursor(snapshot.id),
    authorize: (access) => {
      if (!access.roles.includes('keeper')) {
        throw new Error('Custom unit catalogue requires keeper access');
      }
    },
  };
  return createUnitDefinitionFirestoreRepository(repositoryOptions);
}
