import {
  and,
  orderBy,
  or,
  query,
  where,
  type CollectionReference,
  type Firestore,
  type QueryConstraint,
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
    ) => buildUnitsQuery(reference, request),
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

function buildUnitsQuery(
  reference: CollectionReference,
  request: ListRequest<UnitDefinitionFilter>,
) {
  const ordering = orderBy('data.code', 'asc');
  const visibility = request.filter?.visibility;
  const record = request.filter?.record;
  const lifecycle = request.lifecycle ?? ['active', 'inactive'];
  const lifecycleConstraint = where('lifecycle.status', 'in', [...lifecycle]);
  const recordConstraints = recordConstraint(record);

  if (request.access.roles.includes('admin')) {
    return buildAdminUnitsQuery(
      reference,
      visibility,
      request.filter?.ownerId,
      request.filter?.ownerName,
      record,
      lifecycleConstraint,
      ordering,
    );
  }

  if (visibility === 'public') {
    return query(
      reference,
      where('data.visibility', '==', 'public'),
      lifecycleConstraint,
      ...recordConstraint(record),
      ordering,
    );
  }

  if (visibility === 'private') {
    return query(
      reference,
      where('data.visibility', '==', 'private'),
      where('data.ownerId', '==', request.access.principalId),
      lifecycleConstraint,
      ...recordConstraint(record),
      ordering,
    );
  }

  const constraints: QueryConstraint[] = [
    // The installed Firebase types expose composite filters separately from
    // QueryConstraint even though query() accepts them at runtime.
    or(
      and(
        where('data.visibility', '==', 'public'),
        lifecycleConstraint,
        ...recordConstraints,
      ),
      and(
        where('data.visibility', '==', 'private'),
        where('data.ownerId', '==', request.access.principalId),
        lifecycleConstraint,
        ...recordConstraints,
      ),
    ) as unknown as QueryConstraint,
    ordering,
  ];
  return query(reference, ...constraints);
}

function buildAdminUnitsQuery(
  reference: CollectionReference,
  visibility: UnitDefinitionFilter['visibility'],
  ownerId: UnitDefinitionFilter['ownerId'],
  ownerName: UnitDefinitionFilter['ownerName'],
  record: UnitDefinitionFilter['record'],
  lifecycleConstraint: QueryConstraint,
  ordering: ReturnType<typeof orderBy>,
) {
  const constraints: QueryConstraint[] = [
    ...(visibility ? [where('data.visibility', '==', visibility)] : []),
    ...(ownerId ? [where('data.ownerId', '==', ownerId)] : []),
    ...ownerNameConstraint(ownerName),
    lifecycleConstraint,
    ...recordConstraint(record),
  ];
  return query(reference, ...constraints, ordering);
}

function recordConstraint(record: string | undefined) {
  return record
    ? [
        where(
          'data.codeSearchTokens',
          'array-contains',
          record.toLocaleLowerCase(),
        ),
      ]
    : [];
}

function ownerNameConstraint(ownerName: string | undefined) {
  return ownerName
    ? [
        where(
          'data.ownerSearchTokens',
          'array-contains',
          ownerName.toLocaleLowerCase(),
        ),
      ]
    : [];
}
