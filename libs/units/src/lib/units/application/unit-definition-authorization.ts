import {
  AUTHORIZATION_ROLES,
  hasAuthorizationRole,
  type AuthorizationPolicy,
} from '@tankos/authz';
import type { EntityId } from '@tankos/data-access';
import type { UnitDefinitionVisibility } from '../core';

export const UNIT_DEFINITION_RESOURCE = 'unit-definition';

/** Attributes required to evaluate access to a unit definition. */
export interface UnitDefinitionAuthorizationAttributes {
  readonly ownerId?: EntityId;
  readonly visibility: UnitDefinitionVisibility;
}

export type UnitDefinitionAuthorizationAction =
  'create' | 'read' | 'use' | 'update' | 'delete' | 'restore' | 'globalize';

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
    return attributes.visibility === 'global' || ownsResource;
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
  if (action === 'globalize') return attributes.visibility === 'private';
  return true;
}

function isPrivate(attributes: UnitDefinitionAuthorizationAttributes): boolean {
  return attributes.visibility === 'private';
}
