export * from './unit-definition-authorization-policy';
export * from './unit-definition-capabilities';
export * from './unit-definition-crud-policy';

import { AUTHORIZATION_ROLES } from '@tankos/authz';
import type { AccessContext } from '@tankos/data-access';

/** Coarse route policy for the unit-definition workspace. */
export function canAccessUnitDefinitions(context: AccessContext): boolean {
  return context.roles.some(
    (role) =>
      role === AUTHORIZATION_ROLES.KEEPER || role === AUTHORIZATION_ROLES.ADMIN,
  );
}
