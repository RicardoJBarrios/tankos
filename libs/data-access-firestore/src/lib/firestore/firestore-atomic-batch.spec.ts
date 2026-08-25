import { describe, expect, it, vi } from 'vitest';
import type { AtomicBatchOperation } from '@tankos/data-access';
import {
  createFirestoreAtomicBatch,
  FIRESTORE_ATOMIC_BATCH_LIMIT,
} from './firestore-atomic-batch';

const firestoreMocks = vi.hoisted(() => ({
  doc: vi.fn((_firestore: unknown, path: string) => ({ path })),
  writeBatch: vi.fn(),
}));

vi.mock('firebase/firestore', () => firestoreMocks);

describe('createFirestoreAtomicBatch', () => {
  beforeEach(() => vi.clearAllMocks());

  function batchHarness() {
    const batch = {
      set: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      commit: vi.fn().mockResolvedValue(undefined),
    };
    firestoreMocks.writeBatch.mockReturnValue(batch);
    return batch;
  }

  it('Given set, update and delete operations, When committed, Then writes them in one client batch', async () => {
    const batch = batchHarness();
    await createFirestoreAtomicBatch({ firestore: {} as never }).commit([
      { kind: 'set', path: 'units/unit-1', document: { name: 'litre' } },
      { kind: 'update', path: 'units/unit-2', patch: { active: false } },
      { kind: 'delete', path: 'units/unit-3' },
    ]);

    expect(batch.set).toHaveBeenCalledWith(
      { path: 'units/unit-1' },
      { name: 'litre' },
    );
    expect(batch.update).toHaveBeenCalledWith(
      { path: 'units/unit-2' },
      { active: false },
    );
    expect(batch.delete).toHaveBeenCalledWith({ path: 'units/unit-3' });
    expect(batch.commit).toHaveBeenCalledOnce();
  });

  it('Given an empty operation list, When committed, Then commits a valid no-op batch', async () => {
    const batch = batchHarness();
    await createFirestoreAtomicBatch({ firestore: {} as never }).commit([]);
    expect(batch.commit).toHaveBeenCalledOnce();
  });

  it('Given a non-array operation value, When committed, Then rejects the invalid input', async () => {
    batchHarness();
    await expect(
      createFirestoreAtomicBatch({ firestore: {} as never }).commit(
        null as never,
      ),
    ).rejects.toThrow(TypeError);
  });

  it('Given more than Firestore allows, When committed, Then rejects before creating a batch', async () => {
    const operations = Array.from(
      { length: FIRESTORE_ATOMIC_BATCH_LIMIT + 1 },
      (_, index) => ({
        kind: 'delete' as const,
        path: `units/unit-${String(index)}`,
      }),
    );
    await expect(
      createFirestoreAtomicBatch({ firestore: {} as never }).commit(operations),
    ).rejects.toThrow(RangeError);
    expect(firestoreMocks.writeBatch).not.toHaveBeenCalled();
  });

  it.each([
    { kind: 'delete', path: '' },
    { kind: 'delete', path: 'units' },
    { kind: 'delete', path: 'units/' },
  ] as const)(
    'Given an invalid document path %j, When committed, Then rejects it',
    async (operation) => {
      batchHarness();
      await expect(
        createFirestoreAtomicBatch({ firestore: {} as never }).commit([
          operation as AtomicBatchOperation,
        ]),
      ).rejects.toThrow(TypeError);
    },
  );

  it('Given a provider permission failure, When committed, Then maps it to forbidden', async () => {
    const batch = batchHarness();
    batch.commit.mockRejectedValue({ code: 'permission-denied' });
    await expect(
      createFirestoreAtomicBatch({ firestore: {} as never }).commit([
        { kind: 'delete', path: 'units/unit-1' },
      ]),
    ).rejects.toMatchObject({ code: 'forbidden' });
  });

  it('Given an unmapped provider failure, When committed, Then maps it to transient', async () => {
    const batch = batchHarness();
    batch.commit.mockRejectedValue(new Error('offline'));
    await expect(
      createFirestoreAtomicBatch({ firestore: {} as never }).commit([
        { kind: 'delete', path: 'units/unit-1' },
      ]),
    ).rejects.toMatchObject({ code: 'transient' });
  });
});
