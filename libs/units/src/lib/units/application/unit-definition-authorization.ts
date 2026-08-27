import {
  AUTHORIZATION_ROLES,
  hasAuthorizationRole,
  AuthorizationDeniedError,
  type AuthorizationPolicy,
} from '@tankos/authz';
import {
  createEntityId,
  type AccessContext,
  type CrudPolicy,
  type EntityId,
} from '@tankos/data-access';
import type { UnitDefinition, UnitDefinitionVisibility } from '../core';

export const UNIT_DEFINITION_RESOURCE = 'unit-definition';

export interface UnitDefinitionCapabilities {
  readonly canCreate: boolean;
  readonly canRead: boolean;
  readonly canUse: boolean;
  readonly canEdit: boolean;
  readonly canDelete: boolean;
  readonly canRestore: boolean;
  readonly canPublish: boolean;
  readonly canInspectDeleted: boolean;
  readonly canFilterByOwner: boolean;
}

/** Calculates UI-neutral capabilities from the same ABAC policy as commands. */
export function unitDefinitionCapabilities(
  access: AccessContext,
  record?: UnitDefinition,
): UnitDefinitionCapabilities {
  const attributes = {
    ownerId: record ? unitOwnerId(record.ownerId) : access.principalId,
    visibility: record?.visibility ?? 'private',
  };
  return {
    canCreate: canUnitAction(access, attributes, 'create'),
    canRead: canUnitAction(access, attributes, 'read'),
    canUse: canUnitAction(access, attributes, 'use'),
    canEdit: record ? canUnitAction(access, attributes, 'update') : false,
    canDelete: record ? canUnitAction(access, attributes, 'delete') : false,
    canRestore: record ? canUnitAction(access, attributes, 'restore') : false,
    canPublish: record ? canUnitAction(access, attributes, 'publish') : false,
    canInspectDeleted: access.roles.includes(AUTHORIZATION_ROLES.ADMIN),
    canFilterByOwner: access.roles.includes(AUTHORIZATION_ROLES.ADMIN),
  };
}

function canUnitAction(
  access: AccessContext,
  attributes: UnitDefinitionAuthorizationAttributes,
  action: UnitDefinitionAuthorizationAction,
): boolean {
  return unitDefinitionAuthorization({
    subject: { id: access.principalId, roles: access.roles },
    action,
    resource: { type: UNIT_DEFINITION_RESOURCE, attributes },
  });
}

/** Adapts the unit ABAC policy to the generic CRUD orchestration contract. */
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
    if (!allowed) {
      throw new AuthorizationDeniedError(action, UNIT_DEFINITION_RESOURCE);
    }
  },
  validateUpdate: (access, current, input) => {
    if (
      current.data.visibility === input.visibility ||
      input.visibility !== 'public'
    ) {
      return;
    }
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

/** Coarse route policy for the unit-definition workspace. */
export function canAccessUnitDefinitions(context: AccessContext): boolean {
  return context.roles.some(
    (role) =>
      role === AUTHORIZATION_ROLES.KEEPER || role === AUTHORIZATION_ROLES.ADMIN,
  );
}

/** Attributes required to evaluate access to a unit definition. */
export interface UnitDefinitionAuthorizationAttributes {
  readonly ownerId?: EntityId;
  readonly visibility: UnitDefinitionVisibility;
}

export type UnitDefinitionAuthorizationAction =
  'create' | 'read' | 'use' | 'update' | 'delete' | 'restore' | 'publish';

/** ABAC policy for unit definitions, independent from persistence providers. */
export const unitDefinitionAuthorizationPolicy: AuthorizationPolicy<UnitDefinitionAuthorizationAttributes> =
  unitDefinitionAuthorization;

export function unitDefinitionAuthorization(
  request: Parameters<
    AuthorizationPolicy<UnitDefinitionAuthorizationAttributes>
  >[0],
): boolean {
  const action = request.action as UnitDefinitionAuthorizationAction;
  const attributes = request.resource.attributes;
  const ownsResource = attributes.ownerId === request.subject.id;

  if (request.resource.type !== UNIT_DEFINITION_RESOURCE) return false;
  if (hasAuthorizationRole(request.subject, AUTHORIZATION_ROLES.ADMIN)) {
    return isAdminAction(action, attributes);
  }
  if (!hasAuthorizationRole(request.subject, AUTHORIZATION_ROLES.KEEPER)) {
    return false;
  }
  return isKeeperAction(action, attributes, ownsResource);
}

function isKeeperAction(
  action: UnitDefinitionAuthorizationAction,
  attributes: UnitDefinitionAuthorizationAttributes,
  ownsResource: boolean,
): boolean {
  if (action === 'create') return isPrivate(attributes) && ownsResource;
  if (action === 'read' || action === 'use') {
    return attributes.visibility === 'public' || ownsResource;
  }
  if (isPrivateMutationAction(action)) {
    return isPrivate(attributes) && ownsResource;
  }
  return false;
}

function isPrivateMutationAction(
  action: UnitDefinitionAuthorizationAction,
): boolean {
  return ['update', 'delete', 'restore'].includes(action);
}

function isAdminAction(
  action: UnitDefinitionAuthorizationAction,
  attributes: UnitDefinitionAuthorizationAttributes,
): boolean {
  if (action === 'create') return true;
  if (action === 'publish') return attributes.visibility === 'private';
  return true;
}

function isPrivate(attributes: UnitDefinitionAuthorizationAttributes): boolean {
  return attributes.visibility === 'private';
}
