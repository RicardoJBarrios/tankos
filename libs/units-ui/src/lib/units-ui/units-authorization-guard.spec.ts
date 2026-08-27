import type { AccessContext } from '@tankos/data-access';
import { describe, expect, it, vi } from 'vitest';

interface MockGuardOptions {
  readonly policy: (context: AccessContext) => boolean;
}

const createAuthorizationGuard = vi.hoisted(() =>
  vi.fn(
    (options: MockGuardOptions) => (context: AccessContext) =>
      options.policy(context),
  ),
);

vi.mock('@tankos/authz-ui', () => ({
  createAuthorizationGuard,
}));

import { unitsAuthorizationGuard } from './units-authorization-guard';

describe('unitsAuthorizationGuard', () => {
  it('creates a guard with the unit access policy', () => {
    expect(createAuthorizationGuard).toHaveBeenCalledTimes(1);
  });

  it.each([['keeper'], ['admin']])('allows a %s', (role) => {
    expect(
      unitsAuthorizationGuard({ principalId: 'user-1', roles: [role] }),
    ).toBe(true);
  });

  it('denies a role without unit-management access', () => {
    expect(
      unitsAuthorizationGuard({ principalId: 'user-1', roles: ['guest'] }),
    ).toBe(false);
  });
});
