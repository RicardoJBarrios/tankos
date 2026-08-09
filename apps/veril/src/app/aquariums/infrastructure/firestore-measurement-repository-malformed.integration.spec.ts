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
import { FirestoreMeasurementRepository } from './firestore-measurement-repository';

describe('FirestoreMeasurementRepository document boundary', () => {
  it('rejects malformed external data through listOwned', async () => {
    firestoreMocks.getDocs.mockResolvedValue({
      docs: [
        {
          id: '123e4567-e89b-42d3-a456-426614174001',
          data: () => ({
            aquariumId: 'not-an-aquarium-id',
            ownerId: 'keeper-1',
            parameterId: 'temperature',
          }),
        },
      ],
    });

    await expect(
      new FirestoreMeasurementRepository().listOwned(
        'keeper-1',
        aquariumIdFrom('123e4567-e89b-42d3-a456-426614174000'),
      ),
    ).rejects.toThrow();
    expect(firestoreMocks.getDocs).toHaveBeenCalledTimes(1);
  });

  it('rejects malformed external data through findCurrentOwned', async () => {
    firestoreMocks.getDocs.mockResolvedValue({
      docs: [
        {
          id: '123e4567-e89b-42d3-a456-426614174001',
          data: () => ({
            aquariumId: 'not-an-aquarium-id',
            ownerId: 'keeper-1',
            parameterId: 'temperature',
          }),
        },
      ],
    });

    await expect(
      new FirestoreMeasurementRepository().findCurrentOwned(
        'keeper-1',
        aquariumIdFrom('123e4567-e89b-42d3-a456-426614174000'),
        'temperature',
      ),
    ).rejects.toThrow();
  });
});
