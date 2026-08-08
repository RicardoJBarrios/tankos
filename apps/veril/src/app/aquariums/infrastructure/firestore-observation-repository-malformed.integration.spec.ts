// @vitest-environment node

import { describe, expect, it, vi } from 'vitest';

const firestoreMocks = vi.hoisted(() => ({
  collection: vi.fn(),
  documentId: vi.fn(),
  getDocs: vi.fn(),
  limit: vi.fn(),
  orderBy: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
}));

vi.mock('firebase/firestore', () => ({
  Timestamp: class Timestamp {},
  ...firestoreMocks,
}));

vi.mock('./firebase-client', () => ({
  getFirebaseClient: vi.fn(() => ({ firestore: {} })),
}));

import { aquariumIdFrom } from '../domain/aquarium';
import { FirestoreObservationRepository } from './firestore-observation-repository';

describe('FirestoreObservationRepository document boundary', () => {
  it('rejects malformed external data through listOwned', async () => {
    firestoreMocks.getDocs.mockResolvedValue({
      docs: [
        {
          id: '123e4567-e89b-42d3-a456-426614174001',
          data: () => ({
            aquariumId: 'not-an-aquarium-id',
            ownerId: 'keeper-1',
            content: 'Observación incompleta',
          }),
        },
      ],
    });

    await expect(
      new FirestoreObservationRepository().listOwned(
        'keeper-1',
        aquariumIdFrom('123e4567-e89b-42d3-a456-426614174000'),
      ),
    ).rejects.toThrow();
    expect(firestoreMocks.getDocs).toHaveBeenCalledTimes(1);
  });
});
