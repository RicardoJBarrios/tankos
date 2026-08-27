import { AUTHORIZATION_ROLES } from '@tankos/authz';
import {
  createEntityId,
  type AccessContext,
  type EntityId,
} from '@tankos/data-access';
import type { UnitDefinition } from '../core';
import {
  UNIT_DEFINITION_RESOURCE,
  unitDefinitionAuthorization,
  type UnitDefinitionAuthorizationAction,
  type UnitDefinitionAuthorizationAttributes,
} from './unit-definition-authorization-policy';

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

/** Calculates UI-neutral capabilities from the domain ABAC policy. */
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

function unitOwnerId(ownerId: string | undefined): EntityId | undefined {
  return ownerId === undefined ? undefined : createEntityId(ownerId);
}
