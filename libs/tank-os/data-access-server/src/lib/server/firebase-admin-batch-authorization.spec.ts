import { describe, expect, it } from 'vitest';
import { DataAccessError, createEntityId } from '@tank-os/data-access';
import { createFirebaseAdminBatchAuthorization } from './firebase-admin-batch-authorization';

describe('createFirebaseAdminBatchAuthorization', () => {
  const access = {
    principalId: createEntityId('worker-1'),
    roles: ['worker'] as const,
  };

  it('Given an authoritative worker claim, When authorized, Then allows the batch', async () => {
    const authorization = createFirebaseAdminBatchAuthorization({
      auth: {
        getUser: async () => ({
          uid: 'worker-1',
          customClaims: { roles: ['worker'] },
        }),
      },
    });

    await expect(
      authorization.authorize(
        createEntityId('batch-1'),
        access.principalId,
        access.principalId,
      ),
    ).resolves.toBeUndefined();
  });

  it('Given a missing or mismatched claim, When authorized, Then rejects the batch', async () => {
    const authorization = createFirebaseAdminBatchAuthorization({
      auth: {
        getUser: async () => ({
          uid: 'worker-1',
          customClaims: { roles: ['keeper'] },
        }),
      },
    });

    await expect(
      authorization.authorize(
        createEntityId('batch-1'),
        access.principalId,
        access.principalId,
      ),
    ).rejects.toMatchObject({
      code: 'forbidden',
    });
  });

  it('Given a mismatched Firebase principal, When authorized, Then rejects the batch', async () => {
    const authorization = createFirebaseAdminBatchAuthorization({
      auth: {
        getUser: async () => ({
          uid: 'another-user',
          customClaims: { roles: ['worker'] },
        }),
      },
    });

    await expect(
      authorization.authorize(
        createEntityId('batch-1'),
        access.principalId,
        access.principalId,
      ),
    ).rejects.toMatchObject({ code: 'forbidden' });
  });

  it('Given a caller different from the submitted principal, When authorized, Then rejects the batch', async () => {
    const authorization = createFirebaseAdminBatchAuthorization({
      auth: {
        getUser: async () => ({
          uid: 'another-user',
          customClaims: { roles: ['worker'] },
        }),
      },
    });

    await expect(
      authorization.authorize(
        createEntityId('batch-1'),
        createEntityId('another-user'),
        access.principalId,
      ),
    ).rejects.toMatchObject({ code: 'forbidden' });
  });

  it('Given an untrusted client role list, When authoritative claims match, Then allows the batch', async () => {
    const authorization = createFirebaseAdminBatchAuthorization({
      auth: {
        getUser: async () => ({
          uid: 'worker-1',
          customClaims: { roles: ['worker'] },
        }),
      },
    });

    await expect(
      authorization.authorize(
        createEntityId('batch-1'),
        access.principalId,
        access.principalId,
      ),
    ).resolves.toBeUndefined();
  });

  it('Given claims with a non-array role value, When authorized, Then rejects the batch', async () => {
    const authorization = createFirebaseAdminBatchAuthorization({
      auth: {
        getUser: async () => ({
          uid: 'worker-1',
          customClaims: { roles: 'worker' },
        }),
      },
    });

    await expect(
      authorization.authorize(
        createEntityId('batch-1'),
        access.principalId,
        access.principalId,
      ),
    ).rejects.toMatchObject({ code: 'forbidden' });
  });

  it('Given custom claim and role names, When both trusted sources match, Then allows the batch', async () => {
    const authorization = createFirebaseAdminBatchAuthorization({
      rolesClaim: 'batchRoles',
      requiredRole: 'batch-worker',
      auth: {
        getUser: async () => ({
          uid: 'worker-1',
          customClaims: { batchRoles: ['batch-worker'] },
        }),
      },
    });

    await expect(
      authorization.authorize(
        createEntityId('batch-1'),
        access.principalId,
        access.principalId,
      ),
    ).resolves.toBeUndefined();
  });

  it('Given an Auth lookup failure, When authorized, Then rejects without exposing provider details', async () => {
    const authorization = createFirebaseAdminBatchAuthorization({
      auth: {
        getUser: async () => {
          throw new Error('provider detail');
        },
      },
    });

    await expect(
      authorization.authorize(
        createEntityId('batch-1'),
        access.principalId,
        access.principalId,
      ),
    ).rejects.toMatchObject({
      code: 'forbidden',
    });
  });

  it('Given a provider DataAccessError, When authorized, Then preserves its normalized error', async () => {
    const error = new DataAccessError('transient', 'temporary', {
      retryable: true,
    });
    const authorization = createFirebaseAdminBatchAuthorization({
      auth: {
        getUser: async () => {
          throw error;
        },
      },
    });

    await expect(
      authorization.authorize(
        createEntityId('batch-1'),
        access.principalId,
        access.principalId,
      ),
    ).rejects.toBe(error);
  });

  it('Given a transient Firebase provider failure, When authorized, Then exposes a retryable transient error', async () => {
    const authorization = createFirebaseAdminBatchAuthorization({
      auth: {
        getUser: async () => {
          throw { code: 'unavailable' };
        },
      },
    });

    await expect(
      authorization.authorize(
        createEntityId('batch-1'),
        access.principalId,
        access.principalId,
      ),
    ).rejects.toMatchObject({ code: 'transient', retryable: true });
  });
});
