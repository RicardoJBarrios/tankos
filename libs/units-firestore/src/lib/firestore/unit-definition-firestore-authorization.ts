import type { AccessContext } from '@tankos/data-access';

export function authorizeUnitDefinitionOperation(
  access: AccessContext,
  operation: string,
  lifecycle: readonly string[] | undefined,
): void {
  if (!access.roles.includes('keeper') && !access.roles.includes('admin')) {
    throw new Error('Unit catalogue requires keeper or admin access');
  }
  if (operation === 'list' && hasHiddenLifecycle(lifecycle, access)) {
    throw new Error('Deleted unit records require admin access');
  }
}

function hasHiddenLifecycle(
  lifecycle: readonly string[] | undefined,
  access: AccessContext,
): boolean {
  return Boolean(
    lifecycle?.some((status) => status !== 'active' && status !== 'inactive') &&
    !access.roles.includes('admin'),
  );
}
