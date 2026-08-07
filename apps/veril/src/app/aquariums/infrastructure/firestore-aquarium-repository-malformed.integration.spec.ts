// @vitest-environment node

import { describe, expect, it, vi } from 'vitest';

const firestoreMocks = vi.hoisted(() => ({
  collection: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  setDoc: vi.fn(),
  where: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  Timestamp: class Timestamp {},
  ...firestoreMocks,
}));

vi.mock('./firebase-client', () => ({
  getFirebaseClient: vi.fn(() => ({ firestore: {} })),
}));

import { FirestoreAquariumRepository } from './firestore-aquarium-repository';

describe('FirestoreAquariumRepository document boundary', () => {
  it('rejects malformed external data through listOwned', async () => {
    firestoreMocks.getDocs.mockResolvedValue({
      docs: [
        {
          id: '00000000-0000-4000-8000-000000000001',
          data: () => ({ ownerId: 'keeper-1', name: 'Sin fecha' }),
        },
      ],
    });

    await expect(
      new FirestoreAquariumRepository().listOwned('keeper-1'),
    ).rejects.toThrow();
    expect(firestoreMocks.getDocs).toHaveBeenCalledTimes(1);
  });
});
