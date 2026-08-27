import type { Firestore } from 'firebase/firestore';
import { createPageCursor } from '@tankos/data-access';
import type { ClockPort } from '@tankos/time';
import type { UnitDefinition } from '@tankos/units';
import {
  createUnitDefinitionFirestoreRepository,
  type UnitDefinitionFirestoreRepositoryOptions,
} from './unit-definition-firestore-repository';
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
    createId: (input: UnitDefinition, access) => {
      const code = String(input.code)
        .replace(/[^0-9A-Za-z]+/gu, '-')
        .toLowerCase();
      const replacement = access?.requestId
        ?.replace(/[^0-9A-Za-z]+/gu, '-')
        .toLowerCase();
      return replacement ? `${code}-${replacement}` : code;
    },
    buildQuery: buildUnitDefinitionQuery,
    encodeCursor: (snapshot) => createPageCursor(snapshot.id),
    authorize: (access, operation, lifecycle) => {
      if (!access.roles.includes('keeper') && !access.roles.includes('admin')) {
        throw new Error('Unit catalogue requires keeper or admin access');
      }
      if (operation === 'list' && hasHiddenLifecycle(lifecycle, access)) {
        throw new Error('Deleted unit records require admin access');
      }
    },
  };
  return createUnitDefinitionFirestoreRepository(repositoryOptions);
}

function hasHiddenLifecycle(
  lifecycle: readonly string[] | undefined,
  access: { readonly roles: readonly string[] },
): boolean {
  return Boolean(
    lifecycle?.some((status) => status !== 'active' && status !== 'inactive') &&
    !access.roles.includes('admin'),
  );
}
