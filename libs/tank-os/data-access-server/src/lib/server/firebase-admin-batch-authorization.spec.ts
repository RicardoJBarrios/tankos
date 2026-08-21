import { describe, expect, it } from 'vitest';
import { createEntityId } from '@tank-os/data-access';
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
      authorization.authorize(createEntityId('batch-1'), access),
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
      authorization.authorize(createEntityId('batch-1'), access),
    ).rejects.toMatchObject({
      code: 'forbidden',
    });
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
      authorization.authorize(createEntityId('batch-1'), access),
    ).rejects.toMatchObject({
      code: 'forbidden',
    });
  });
});
