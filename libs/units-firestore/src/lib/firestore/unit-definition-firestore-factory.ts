import {
  and,
  orderBy,
  or,
  query,
  where,
  type CollectionReference,
  type Firestore,
} from 'firebase/firestore';
import { createPageCursor, type ListRequest } from '@tankos/data-access';
import type { ClockPort } from '@tankos/time';
import type { UnitDefinition, UnitDefinitionFilter } from '@tankos/units';
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
    buildQuery: (
      reference: CollectionReference,
      request: ListRequest<UnitDefinitionFilter>,
    ) => {
      const ordering = orderBy('data.code', 'asc');
      if (request.access.roles.includes('admin')) {
        return query(reference, ordering);
      }
      return query(
        reference,
        or(
          where('data.visibility', '==', 'global'),
          and(
            where('data.visibility', '==', 'private'),
            where('data.ownerId', '==', request.access.principalId),
          ),
        ),
        ordering,
      );
    },
    encodeCursor: (snapshot) => createPageCursor(snapshot.id),
    authorize: (access) => {
      if (!access.roles.includes('keeper') && !access.roles.includes('admin')) {
        throw new Error(
          'Custom unit catalogue requires keeper or admin access',
        );
      }
    },
  };
  return createUnitDefinitionFirestoreRepository(repositoryOptions);
}
