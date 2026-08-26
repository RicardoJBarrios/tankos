import {
  AuthorizationDeniedError,
  createAuthorizationPort,
  type AuthorizationRequest,
} from './authorization';

describe('createAuthorizationPort', () => {
  const request: AuthorizationRequest = {
    subject: { id: 'user-1', roles: ['keeper'] },
    action: 'read',
    resource: {
      type: 'domain-resource',
      id: 'resource-1',
      attributes: { ownerId: 'user-1' },
    },
  };

  it('returns true when the domain policy allows the request', async () => {
    const policy = createAuthorizationPort(() => true);
    await expect(policy.can(request)).resolves.toBe(true);
    await expect(policy.authorize(request)).resolves.toBeUndefined();
  });

  it('returns false without throwing when the domain policy denies the request', async () => {
    const policy = createAuthorizationPort(() => false);
    await expect(policy.can(request)).resolves.toBe(false);
  });

  it('throws a provider-neutral error for a denied request', async () => {
    const policy = createAuthorizationPort(() => false);
    await expect(policy.authorize(request)).rejects.toEqual(
      new AuthorizationDeniedError('read', 'domain-resource'),
    );
  });

  it('passes the complete request to an asynchronous domain policy', async () => {
    const policy = vi.fn().mockResolvedValue(true);
    const authorization = createAuthorizationPort(policy);
    await authorization.can(request);
    expect(policy).toHaveBeenCalledWith(request);
  });
});
