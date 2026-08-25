// @vitest-environment node

import { describe, expect, it, vi } from 'vitest';

const firestoreMocks = vi.hoisted(() => ({
  collection: vi.fn(),
  doc: vi.fn(),
  documentId: vi.fn(),
  getDocs: vi.fn(),
  limit: vi.fn(),
  orderBy: vi.fn(),
  query: vi.fn(),
  runTransaction: vi.fn(),
  setDoc: vi.fn(),
  where: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  Timestamp: class Timestamp {},
  ...firestoreMocks,
}));

vi.mock('../../shared/infrastructure/firebase-client', () => ({
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

  it('rejects an invalid timezone before writing', async () => {
    await expect(
      new FirestoreAquariumRepository().configure({
        aquariumId: '00000000-0000-4000-8000-000000000001' as never,
        ownerKeeperId: 'keeper-1',
        timeZone: 'Not/A_Timezone' as never,
      }),
    ).rejects.toThrow('valid IANA time zone');
    expect(firestoreMocks.runTransaction).not.toHaveBeenCalled();
  });

  it('rejects a malformed persisted Parameter target map through the Dashboard reader', async () => {
    const timestamp = new (await import('firebase/firestore')).Timestamp(0, 0);
    firestoreMocks.getDocs.mockResolvedValue({
      docs: [
        {
          id: '00000000-0000-4000-8000-000000000001',
          data: () => ({
            ownerId: 'keeper-1',
            name: 'Veril',
            establishedBy: 'keeper-1',
            establishedAt: timestamp,
            parameterTargets: { temperature: { minimum: 26 } },
          }),
        },
      ],
    });

    await expect(
      new FirestoreAquariumRepository().getDashboardContextOwned(
        'keeper-1',
        '00000000-0000-4000-8000-000000000001' as never,
      ),
    ).rejects.toThrow();
  });
});
