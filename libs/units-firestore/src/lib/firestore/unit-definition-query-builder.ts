import {
  and,
  orderBy,
  or,
  query,
  where,
  type CollectionReference,
  type QueryConstraint,
} from 'firebase/firestore';
import { type ListRequest } from '@tankos/data-access';
import type { UnitDefinitionFilter } from '@tankos/units';

/** Builds the unit-specific Firestore query without composing the repository. */
export function buildUnitDefinitionQuery(
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
      ...recordConstraints,
      ordering,
    );
  }

  if (visibility === 'private') {
    return query(
      reference,
      where('data.visibility', '==', 'private'),
      where('data.ownerId', '==', request.access.principalId),
      lifecycleConstraint,
      ...recordConstraints,
      ordering,
    );
  }

  const constraints: QueryConstraint[] = [
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
