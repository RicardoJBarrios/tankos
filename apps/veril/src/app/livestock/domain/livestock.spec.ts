import { describe, expect, it } from 'vitest';
import { aquariumIdFrom } from '../../shared/domain/aquarium-reference';
import {
  createLivestock,
  livestockIdFrom,
  removeLivestock,
  transferLivestock,
} from './livestock';

const firstAquarium = aquariumIdFrom('123e4567-e89b-42d3-a456-426614174000');
const secondAquarium = aquariumIdFrom('123e4567-e89b-42d3-a456-426614174001');
const profileId = 'clownfish-profile';

function livestock() {
  const associatedAt = new Date('2026-01-01T00:00:00.000Z');
  return createLivestock({
    id: livestockIdFrom('123e4567-e89b-42d3-a456-426614174002'),
    aquariumId: firstAquarium,
    speciesProfileId: profileId,
    category: 'fish',
    representation: 'individual',
    displayName: ' Nemo ',
    associatedAt,
    updatedAt: associatedAt,
    associationHistory: [{ aquariumId: firstAquarium, associatedAt }],
  });
}

describe('Livestock', () => {
  it('normalizes the display name and starts active', () => {
    expect(livestock()).toMatchObject({
      displayName: 'Nemo',
      lifecycle: 'active',
    });
  });

  it('preserves the previous aquarium association on transfer', () => {
    const transferredAt = new Date('2026-02-01T00:00:00.000Z');
    const result = transferLivestock(
      livestock(),
      secondAquarium,
      transferredAt,
    );

    expect(result.aquariumId).toBe(secondAquarium);
    expect(result.associationHistory).toEqual([
      {
        aquariumId: firstAquarium,
        associatedAt: new Date('2026-01-01T00:00:00.000Z'),
        endedAt: transferredAt,
      },
      { aquariumId: secondAquarium, associatedAt: transferredAt },
    ]);
  });

  it('soft deletes without losing the association history', () => {
    const result = removeLivestock(
      livestock(),
      new Date('2026-03-01T00:00:00.000Z'),
    );

    expect(result.lifecycle).toBe('removed');
    expect(result.associationHistory).toHaveLength(1);
  });

  it('rejects transferring removed livestock', () => {
    const removed = removeLivestock(
      livestock(),
      new Date('2026-03-01T00:00:00.000Z'),
    );
    expect(() =>
      transferLivestock(removed, secondAquarium, new Date()),
    ).toThrow('Removed Livestock cannot be transferred');
  });
});
