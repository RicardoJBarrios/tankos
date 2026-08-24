import { createEntityId } from '@tankos/data-access';
import { vi } from 'vitest';
import type { FirestoreCrudRepositoryOptions } from './firestore-crud-repository';
import {
  authorizeFirestoreAccess,
  authorizeFirestoreLifecycleRead,
  requireFirestoreRevision,
} from './firestore-crud-repository-policy';

describe('firestore CRUD policy', () => {
  const access = { principalId: createEntityId('keeper'), roles: [] };
  const record = {
    id: createEntityId('record'),
    data: {},
    lifecycle: { status: 'active' as const },
    revision: 1,
    metadata: {
      schemaVersion: 1,
      createdAt: { kind: 'instant' as const, epochMilliseconds: 0 },
      updatedAt: { kind: 'instant' as const, epochMilliseconds: 0 },
    },
  };
  const options = {
    authorize: undefined,
  } as unknown as FirestoreCrudRepositoryOptions<
    unknown,
    unknown,
    unknown,
    unknown
  >;

  it('Given a matching revision, When validating a command, Then accepts it', () => {
    expect(() =>
      requireFirestoreRevision(
        { id: record.id, access, expectedRevision: 1 },
        record,
      ),
    ).not.toThrow();
  });

  it('Given a stale revision, When validating a command, Then raises a conflict', () => {
    expect(() =>
      requireFirestoreRevision(
        { id: record.id, access, expectedRevision: 2 },
        record,
      ),
    ).toThrow('Record revision is stale');
  });

  it('Given no host policy, When a lifecycle write is authorized, Then rejects it', async () => {
    await expect(
      authorizeFirestoreAccess(options, access, 'delete'),
    ).rejects.toThrow('requires an authorization policy');
  });

  it('Given a host policy, When a command is authorized, Then delegates the operation and lifecycle', async () => {
    const authorize = vi.fn();
    const configured = {
      ...options,
      authorize,
    } as unknown as FirestoreCrudRepositoryOptions<
      unknown,
      unknown,
      unknown,
      unknown
    >;
    await authorizeFirestoreAccess(configured, access, 'list', ['active']);
    expect(authorize).toHaveBeenCalledWith(access, 'list', ['active']);
  });

  it('Given hidden lifecycle states without a host policy, When reading, Then rejects the request', async () => {
    await expect(
      authorizeFirestoreLifecycleRead(
        options,
        access,
        ['marked-for-deletion'],
        'list',
      ),
    ).rejects.toThrow('hidden lifecycle states');
  });

  it('Given deleted lifecycle visibility without a host policy, When reading, Then rejects it before transport access', async () => {
    await expect(
      authorizeFirestoreLifecycleRead(options, access, ['deleted'], 'get'),
    ).rejects.toThrow('hidden lifecycle states');
  });

  it('Given hidden lifecycle visibility with a host policy, When reading, Then delegates it to the host', async () => {
    const authorize = vi.fn();
    const configured = {
      ...options,
      authorize,
    } as unknown as FirestoreCrudRepositoryOptions<
      unknown,
      unknown,
      unknown,
      unknown
    >;
    await authorizeFirestoreLifecycleRead(
      configured,
      access,
      ['deleted'],
      'get',
    );
    expect(authorize).toHaveBeenCalledWith(access, 'get', ['deleted']);
  });
});
