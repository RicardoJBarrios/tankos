import {
  and,
  orderBy,
  or,
  query,
  where,
  type CollectionReference,
  type QueryFieldFilterConstraint,
  type QueryConstraint,
} from 'firebase/firestore';
import { type ListRequest } from '@tankos/data-access';
import type { UnitDefinitionFilter } from '@tankos/units';
import { unitDefinitionSearchToken } from '@tankos/units-zod';

/** Builds the unit-specific Firestore query without composing the repository. */
export function buildUnitDefinitionQuery(
  reference: CollectionReference,
  request: ListRequest<UnitDefinitionFilter>,
) {
  // The document id is a deterministic tie-breaker for deleted revisions and
  // makes the cursor `(code, id)` stable across pages.
  const ordering = [
    orderBy('data.code', 'asc'),
    orderBy('__name__', 'asc'),
  ] as const;
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

  return buildKeeperUnitsQuery(
    reference,
    request.access.principalId,
    visibility,
    lifecycleConstraint,
    recordConstraints,
    ordering,
  );
}

function buildKeeperUnitsQuery(
  reference: CollectionReference,
  principalId: string,
  visibility: UnitDefinitionFilter['visibility'],
  lifecycleConstraint: QueryFieldFilterConstraint,
  recordConstraints: QueryFieldFilterConstraint[],
  ordering: readonly [ReturnType<typeof orderBy>, ReturnType<typeof orderBy>],
) {
  if (visibility === 'public')
    return query(
      reference,
      where('data.visibility', '==', 'public'),
      lifecycleConstraint,
      ...recordConstraints,
      ...ordering,
    );
  if (visibility === 'private')
    return query(
      reference,
      where('data.visibility', '==', 'private'),
      where('data.ownerId', '==', principalId),
      lifecycleConstraint,
      ...recordConstraints,
      ...ordering,
    );
  return query(
    reference,
    or(
      and(
        where('data.visibility', '==', 'public'),
        lifecycleConstraint,
        ...recordConstraints,
      ),
      and(
        where('data.visibility', '==', 'private'),
        where('data.ownerId', '==', principalId),
        lifecycleConstraint,
        ...recordConstraints,
      ),
    ) as unknown as QueryConstraint,
    ...ordering,
  );
}

function buildAdminUnitsQuery(
  reference: CollectionReference,
  visibility: UnitDefinitionFilter['visibility'],
  ownerId: UnitDefinitionFilter['ownerId'],
  ownerName: UnitDefinitionFilter['ownerName'],
  record: UnitDefinitionFilter['record'],
  lifecycleConstraint: QueryConstraint,
  ordering: readonly [ReturnType<typeof orderBy>, ReturnType<typeof orderBy>],
) {
  const constraints: QueryConstraint[] = [
    ...(visibility ? [where('data.visibility', '==', visibility)] : []),
    ...(ownerId ? [where('data.ownerId', '==', ownerId)] : []),
    ...ownerNameConstraint(ownerName),
    lifecycleConstraint,
    // Firestore composite indexes support only one array field. When both
    // searches are present, ownerName is the remote candidate filter and the
    // record substring is verified by the UI after the page is read.
    ...(ownerName ? [] : recordConstraint(record)),
  ];
  return query(reference, ...constraints, ...ordering);
}

function recordConstraint(record: string | undefined) {
  const token =
    record === undefined ? undefined : unitDefinitionSearchToken(record);
  return token ? [where('data.codeSearchTokens', 'array-contains', token)] : [];
}

function ownerNameConstraint(ownerName: string | undefined) {
  const token =
    ownerName === undefined ? undefined : unitDefinitionSearchToken(ownerName);
  return token
    ? [where('data.ownerSearchTokens', 'array-contains', token)]
    : [];
}
