import { createAuthorizationGuard } from '@tankos/authz-ui';
import { canAccessUnitDefinitions } from '@tankos/units';

/** Angular route guard for the unit-definition workspace. */
export const unitsAuthorizationGuard = createAuthorizationGuard({
  policy: (context) => canAccessUnitDefinitions(context),
});
