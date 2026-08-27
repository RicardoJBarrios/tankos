import {
  collection,
  getDocs,
  limit,
  query,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { createFirestoreAuthorizationGrantStore } from './authz-firestore';

vi.mock('firebase/firestore', () => ({
  collection: vi.fn((_firestore: unknown, path: string) => ({ path })),
  deleteField: vi.fn(() => 'DELETE_FIELD'),
  doc: vi.fn((reference: { path: string }, id: string) => ({
    path: `${reference.path}/${id}`,
  })),
  getDocs: vi.fn(),
  query: vi.fn((reference: unknown, ...constraints: unknown[]) => ({
    reference,
    constraints,
  })),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  where: vi.fn((field: string, operator: string, value: unknown) => ({
    field,
    operator,
    value,
  })),
  limit: vi.fn((value: number) => ({ type: 'limit', value })),
}));

describe('createFirestoreAuthorizationGrantStore', () => {
  const firestore = {} as never;
  const grant = {
    id: 'grant-1' as never,
    subjectId: 'user-1' as never,
    resourceType: 'unit-definition',
    resourceId: 'unit-1' as never,
    actions: ['read', 'use'],
    effect: 'allow' as const,
    status: 'active' as const,
    attributes: { source: 'domain' },
  };

  beforeEach(() => vi.clearAllMocks());

  it('finds active grants by subject and resource', async () => {
    vi.mocked(getDocs).mockResolvedValue({
      docs: [{ id: 'grant-1', data: () => grant }],
    } as never);
    const store = createFirestoreAuthorizationGrantStore({ firestore });

    await expect(
      store.find({
        subjectId: 'user-1' as never,
        resourceType: 'unit-definition',
        resourceId: 'unit-1' as never,
      }),
    ).resolves.toEqual([grant]);

    expect(where).toHaveBeenCalledTimes(4);
    expect(query).toHaveBeenCalledOnce();
    expect(limit).toHaveBeenCalledWith(100);
  });

  it('finds all active resources of a type when no resource id is supplied', async () => {
    vi.mocked(getDocs).mockResolvedValue({ docs: [] } as never);
    const store = createFirestoreAuthorizationGrantStore({
      firestore,
      collectionPath: 'domainGrants',
    });

    await store.find({
      subjectId: 'user-1' as never,
      resourceType: 'unit-definition',
    });

    expect(where).toHaveBeenCalledTimes(3);
    expect(collection).toHaveBeenCalledWith(firestore, 'domainGrants');
  });

  it('saves a grant using its stable id', async () => {
    const store = createFirestoreAuthorizationGrantStore({ firestore });

    await store.save(grant);

    expect(setDoc).toHaveBeenCalledWith(
      { path: 'authorizationGrants/grant-1' },
      grant,
    );

    await store.save({ ...grant, attributes: { nullable: null } });
  });

  it('revokes a grant and removes its optional attributes', async () => {
    const store = createFirestoreAuthorizationGrantStore({ firestore });

    await store.revoke('grant-1' as never);

    expect(updateDoc).toHaveBeenCalledWith(
      { path: 'authorizationGrants/grant-1' },
      { status: 'revoked' },
    );
  });

  it('rejects unsafe grant ids and malformed grants before writing', async () => {
    const store = createFirestoreAuthorizationGrantStore({ firestore });

    await expect(store.revoke('../grant' as never)).rejects.toThrow(
      'Invalid authorization grant id',
    );
    await expect(store.save({ ...grant, actions: [] })).rejects.toThrow(
      'Invalid authorization grant',
    );
    expect(setDoc).not.toHaveBeenCalled();
  });

  it('rejects malformed persisted grant data', async () => {
    vi.mocked(getDocs).mockResolvedValue({
      docs: [
        {
          id: 'broken',
          data: () => ({ ...grant, actions: ['read', 42] }),
        },
      ],
    } as never);
    const store = createFirestoreAuthorizationGrantStore({ firestore });

    await expect(
      store.find({
        subjectId: 'user-1' as never,
        resourceType: 'unit-definition',
      }),
    ).rejects.toThrow('Invalid authorization grant: broken');
  });

  it.each([
    ['effect', { ...grant, effect: 'unknown' }],
    ['status', { ...grant, status: 'unknown' }],
  ])('rejects an invalid %s value', async (_field, value) => {
    vi.mocked(getDocs).mockResolvedValue({
      docs: [{ id: 'broken', data: () => value }],
    } as never);
    const store = createFirestoreAuthorizationGrantStore({ firestore });

    await expect(
      store.find({
        subjectId: 'user-1' as never,
        resourceType: 'unit-definition',
      }),
    ).rejects.toThrow('Invalid authorization grant: broken');
  });

  it('rejects an optional attribute with an invalid shape', async () => {
    vi.mocked(getDocs).mockResolvedValue({
      docs: [{ id: 'grant-3', data: () => ({ ...grant, attributes: [] }) }],
    } as never);
    const store = createFirestoreAuthorizationGrantStore({ firestore });

    await expect(
      store.find({
        subjectId: 'user-1' as never,
        resourceType: 'unit-definition',
      }),
    ).rejects.toThrow('Invalid authorization grant: grant-3');
  });

  it('accepts revoked grants without attributes', async () => {
    vi.mocked(getDocs).mockResolvedValue({
      docs: [
        {
          id: 'grant-2',
          data: () => ({
            ...grant,
            effect: 'deny',
            status: 'revoked',
            attributes: null,
          }),
        },
      ],
    } as never);
    const store = createFirestoreAuthorizationGrantStore({ firestore });

    await expect(
      store.find({
        subjectId: 'user-1' as never,
        resourceType: 'unit-definition',
        status: 'revoked',
      }),
    ).resolves.toHaveLength(1);
  });

  it('accepts null-valued grant attributes', async () => {
    vi.mocked(getDocs).mockResolvedValue({
      docs: [
        {
          id: 'grant-null-attribute',
          data: () => ({
            ...grant,
            attributes: { optional: null, count: 1, enabled: true },
          }),
        },
      ],
    } as never);
    const store = createFirestoreAuthorizationGrantStore({ firestore });

    await expect(
      store.find({
        subjectId: 'user-1' as never,
        resourceType: 'unit-definition',
      }),
    ).resolves.toHaveLength(1);
  });
});
