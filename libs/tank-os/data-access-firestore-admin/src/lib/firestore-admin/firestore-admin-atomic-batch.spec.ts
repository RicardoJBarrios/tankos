import { describe, expect, it, vi } from 'vitest';
import { createEntityId } from '@tank-os/data-access';
import { createFirestoreAdminAtomicBatch } from './firestore-admin-atomic-batch';

describe('createFirestoreAdminAtomicBatch', () => {
  function harness() {
    const batch = {
      set: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      commit: vi.fn().mockResolvedValue(undefined),
    };
    const firestore = {
      batch: () => batch,
      doc: (path: string) => ({ path }),
    };
    return { batch, firestore };
  }

  it('Given valid set, update and delete operations, When committed, Then sends one atomic commit', async () => {
    const { batch, firestore } = harness();
    const adapter = createFirestoreAdminAtomicBatch({
      firestore: firestore as never,
    });

    await adapter.commit([
      { kind: 'set', path: 'units/unit-1', document: { name: 'litre' } },
      { kind: 'update', path: 'units/unit-1', patch: { active: true } },
      { kind: 'delete', path: 'units/unit-2' },
    ]);

    expect(batch.set).toHaveBeenCalledWith(
      { path: 'units/unit-1' },
      { name: 'litre' },
    );
    expect(batch.update).toHaveBeenCalledWith(
      { path: 'units/unit-1' },
      { active: true },
    );
    expect(batch.delete).toHaveBeenCalledWith({ path: 'units/unit-2' });
    expect(batch.commit).toHaveBeenCalledOnce();
  });

  it.each([0, 401, NaN, Infinity, -Infinity])(
    'Given an invalid operation limit (%s), When created, Then rejects configuration',
    (maxOperations) => {
      expect(() =>
        createFirestoreAdminAtomicBatch({
          firestore: harness().firestore as never,
          maxOperations,
        }),
      ).toThrow(RangeError);
    },
  );

  it('Given an empty operation list, When committed, Then rejects validation', async () => {
    const adapter = createFirestoreAdminAtomicBatch({
      firestore: harness().firestore as never,
    });

    await expect(adapter.commit([])).rejects.toMatchObject({
      code: 'validation',
    });
  });

  it('Given more operations than allowed, When committed, Then rejects before touching Firestore', async () => {
    const { batch, firestore } = harness();
    const adapter = createFirestoreAdminAtomicBatch({
      firestore: firestore as never,
      maxOperations: 1,
    });

    await expect(
      adapter.commit([
        { kind: 'delete', path: `units/${createEntityId('one')}` },
        { kind: 'delete', path: `units/${createEntityId('two')}` },
      ]),
    ).rejects.toMatchObject({ code: 'validation' });
    expect(batch.commit).not.toHaveBeenCalled();
  });

  it('Given an empty document path, When committed, Then rejects validation without leaking provider errors', async () => {
    const { firestore } = harness();
    const adapter = createFirestoreAdminAtomicBatch({
      firestore: firestore as never,
    });

    await expect(
      adapter.commit([{ kind: 'delete', path: ' ' }]),
    ).rejects.toMatchObject({
      code: 'validation',
    });
  });

  it('Given a provider commit failure, When committed, Then maps it to a transient error', async () => {
    const { batch, firestore } = harness();
    batch.commit.mockRejectedValue(new Error('network'));
    const adapter = createFirestoreAdminAtomicBatch({
      firestore: firestore as never,
    });

    await expect(
      adapter.commit([{ kind: 'delete', path: 'units/unit-1' }]),
    ).rejects.toMatchObject({
      code: 'transient',
    });
  });
});
