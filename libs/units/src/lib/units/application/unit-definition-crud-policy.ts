import { AuthorizationDeniedError } from '@tankos/authz';
import {
  createEntityId,
  type CrudPolicy,
  type EntityId,
} from '@tankos/data-access';
import type { UnitDefinition } from '../core';
import {
  UNIT_DEFINITION_RESOURCE,
  unitDefinitionAuthorizationPolicy,
  type UnitDefinitionAuthorizationAction,
} from './unit-definition-authorization-policy';

/** Adapts the domain ABAC policy to generic CRUD orchestration. */
export const unitDefinitionCrudPolicy: CrudPolicy<
  UnitDefinition,
  UnitDefinition,
  UnitDefinition
> = {
  authorize: ({ operation, access, record, input }) => {
    const data = record?.data ?? input;
    if (!data) return;
    const action = crudOperationAction(operation);
    const allowed = unitDefinitionAuthorizationPolicy({
      subject: { id: access.principalId, roles: access.roles },
      action,
      resource: {
        type: UNIT_DEFINITION_RESOURCE,
        ...(record ? { id: record.id } : {}),
        attributes: {
          ownerId: unitOwnerId(data.ownerId),
          visibility: data.visibility ?? 'private',
        },
      },
    });
    if (!allowed)
      throw new AuthorizationDeniedError(action, UNIT_DEFINITION_RESOURCE);
  },
  validateUpdate: (access, current, input) => {
    if (
      current.data.visibility === input.visibility ||
      input.visibility !== 'public'
    )
      return;
    const allowed = unitDefinitionAuthorizationPolicy({
      subject: { id: access.principalId, roles: access.roles },
      action: 'publish',
      resource: {
        type: UNIT_DEFINITION_RESOURCE,
        id: current.id,
        attributes: {
          ownerId: unitOwnerId(current.data.ownerId),
          visibility: current.data.visibility ?? 'private',
        },
      },
    });
    if (!allowed)
      throw new AuthorizationDeniedError('publish', UNIT_DEFINITION_RESOURCE);
  },
};

function unitOwnerId(ownerId: string | undefined): EntityId | undefined {
  return ownerId === undefined ? undefined : createEntityId(ownerId);
}

function crudOperationAction(
  operation: Parameters<
    CrudPolicy<UnitDefinition, UnitDefinition, UnitDefinition>['authorize']
  >[0]['operation'],
): UnitDefinitionAuthorizationAction {
  if (operation === 'create') return 'create';
  if (operation === 'get') return 'read';
  if (operation === 'replace') return 'update';
  if (operation === 'markForDeletion' || operation === 'delete')
    return 'delete';
  if (operation === 'restore') return 'restore';
  return 'read';
}
