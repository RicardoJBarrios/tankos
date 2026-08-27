import type { Firestore } from 'firebase/firestore';
import { createPageCursor } from '@tankos/data-access';
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
    encodeCursor: (snapshot) => createPageCursor(snapshot.id),
    authorize: authorizeUnitDefinitionOperation,
  };
  return createUnitDefinitionFirestoreRepository(repositoryOptions);
}
