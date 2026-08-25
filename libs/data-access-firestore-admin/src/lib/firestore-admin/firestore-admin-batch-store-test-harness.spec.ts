import { describe, expect, it, vi } from 'vitest';
import { createEntityId, type BatchOperationRecord } from '@tankos/data-access';
import { createFirestoreAdminBatchStore } from './firestore-admin-batch-store';

interface FakeReference {
  readonly path: string;
  readonly get: () => Promise<FakeSnapshot>;
  readonly set: (value: Record<string, unknown>) => Promise<void>;
  readonly update: (value: Record<string, unknown>) => Promise<void>;
  readonly collection: (name: string) => FakeCollection;
}

interface FakeSnapshot {
  readonly exists: boolean;
  readonly data: () => Record<string, unknown> | undefined;
  readonly ref: FakeReference;
}

interface FakeCollection {
  readonly doc: (id: string) => FakeReference;
  readonly get: () => Promise<{
    readonly docs: readonly FakeSnapshot[];
    readonly empty: boolean;
    readonly size: number;
  }>;
  readonly limit: (value: number) => { readonly get: FakeCollection['get'] };
  readonly where: () => {
    readonly get: FakeCollection['get'];
    readonly limit: (value: number) => { readonly get: FakeCollection['get'] };
  };
}

export function createHarness(failure?: unknown, writeFailure?: unknown) {
  const values = new Map<string, Record<string, unknown>>();
  const snapshot = (path: string) => ({
    exists: values.has(path),
    data: () => values.get(path),
    ref: reference(path),
  });
  const reference = (path: string): FakeReference => ({
    path,
    get: async () => {
      if (failure !== undefined) throw failure;
      return snapshot(path);
    },
    set: async (value: Record<string, unknown>) => {
      if (writeFailure !== undefined) throw writeFailure;
      values.set(path, value);
    },
    update: async (value: Record<string, unknown>) => {
      if (writeFailure !== undefined) throw writeFailure;
      const current = values.get(path);
      if (!current) throw { code: 'not-found' };
      values.set(path, { ...current, ...value });
    },
    collection: (name: string) => collection(`${path}/${name}`),
  });
  const collection = (path: string): FakeCollection => ({
    doc: (id: string) => reference(`${path}/${id}`),
    get: async () => {
      if (failure !== undefined) throw failure;
      const docs = [...values.entries()]
        .filter(
          ([key]) =>
            key.startsWith(`${path}/`) &&
            key.slice(path.length + 1).includes('/') === false,
        )
        .map(([key, value]) => ({ ref: reference(key), data: () => value }));
      return { docs, empty: docs.length === 0, size: docs.length };
    },
    limit: (value) => ({
      get: async () => {
        const result = await collection(path).get();
        const docs = result.docs.slice(0, value);
        return { docs, empty: docs.length === 0, size: docs.length };
      },
    }),
    where: () => ({
      get: () => collection(path).get(),
      limit: (value) => ({
        get: async () => {
          const result = await collection(path).get();
          const docs = result.docs.slice(0, value);
          return { docs, empty: docs.length === 0, size: docs.length };
        },
      }),
    }),
  });
  const batch = {
    delete: vi.fn((ref: { path: string }) => values.delete(ref.path)),
    update: vi.fn((ref: { path: string }, value: Record<string, unknown>) => {
      const current = values.get(ref.path);
      if (!current) throw { code: 'not-found' };
      values.set(ref.path, { ...current, ...value });
    }),
    commit: vi.fn().mockImplementation(async () => {
      if (writeFailure !== undefined) throw writeFailure;
    }),
  };
  const transaction = {
    get: async (ref: { get: () => Promise<unknown> }) => ref.get(),
    create: (ref: { path: string }, value: Record<string, unknown>) => {
      if (values.has(ref.path)) throw { code: 'already-exists' };
      values.set(ref.path, value);
    },
    update: (ref: { path: string }, value: Record<string, unknown>) => {
      const current = values.get(ref.path);
      if (!current) throw { code: 'not-found' };
      values.set(ref.path, { ...current, ...value });
    },
    set: (ref: { path: string }, value: Record<string, unknown>) => {
      if (writeFailure !== undefined) throw writeFailure;
      values.set(ref.path, value);
    },
  };
  const firestore = {
    collection,
    runTransaction: async (
      callback: (value: typeof transaction) => Promise<unknown>,
    ) => callback(transaction),
    batch: () => batch,
  };
  return { firestore, values, batch };
}

export function record(): BatchOperationRecord<{ label: string }> {
  return {
    batchId: createEntityId('batch-1'),
    principalId: createEntityId('keeper-1'),
    schema: 'units',
    operation: 'update',
    status: 'queued',
    total: 2,
    processed: 0,
    warnings: 0,
    failures: 0,
    retryCount: 0,
    createdAt: { kind: 'instant', epochMilliseconds: 0 },
    updatedAt: { kind: 'instant', epochMilliseconds: 0 },
    selection: { fingerprint: 'scope', total: 2, chunkCount: 1 },
    payload: { label: 'litre' },
    requestFingerprint: 'request-1',
  };
}

export function leaseOf(claim: {
  readonly lease?: { readonly owner: string; readonly token: string };
}): { readonly owner: string; readonly token: string } {
  if (!claim.lease) throw new Error('Expected a worker lease');
  return claim.lease;
}

export const createWorkerStore = (
  options: Parameters<typeof createFirestoreAdminBatchStore>[0],
) => {
  const stores = createFirestoreAdminBatchStore(options);
  return Object.assign(stores.workerStore, {
    create: stores.submissionStore.create,
  });
};
export const createSubmissionStore = (
  options: Parameters<typeof createFirestoreAdminBatchStore>[0],
) => createFirestoreAdminBatchStore(options).submissionStore;
export const createMaterializerStore = (
  options: Parameters<typeof createFirestoreAdminBatchStore>[0],
) => createFirestoreAdminBatchStore(options).materializerStore;

describe('firestore-admin-batch-store-test-harness', () => {
  it('provides deterministic in-memory Firestore dependencies', () => {
    expect(createHarness().firestore).toBeDefined();
  });
});
