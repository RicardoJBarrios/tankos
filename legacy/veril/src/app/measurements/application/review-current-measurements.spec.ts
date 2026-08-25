import { describe, expect, it, vi } from 'vitest';
import { aquariumIdFrom } from '../../shared/domain/aquarium-reference';
import { ActiveAquariumContext } from '../../shared/application/active-aquarium-context';
import { ActiveAquariumContextStorage } from '../../shared/application/active-aquarium-context-storage';
import { CurrentMeasurementReader, KeeperSession } from './ports';
import { ReviewCurrentMeasurements } from './review-current-measurements';

const aquariumId = aquariumIdFrom('123e4567-e89b-42d3-a456-426614174000');

function setup() {
  const reader: CurrentMeasurementReader = { findCurrentOwned: vi.fn() };
  const keeperSession: KeeperSession = {
    requireAuthenticatedKeeper: vi.fn().mockResolvedValue({ id: 'keeper-a' }),
  };
  const storage: ActiveAquariumContextStorage = {
    load: vi.fn(),
    save: vi.fn(),
    clear: vi.fn(),
  };
  const context = new ActiveAquariumContext(storage);
  context.select(aquariumId);

  return {
    reader,
    keeperSession,
    context,
    review: new ReviewCurrentMeasurements(reader, keeperSession, context),
  };
}

describe('ReviewCurrentMeasurements', () => {
  it('requires an authenticated keeper', async () => {
    const { review, keeperSession, reader } = setup();
    const failure = new Error('Authentication unavailable');
    vi.mocked(keeperSession.requireAuthenticatedKeeper).mockRejectedValue(
      failure,
    );

    await expect(review.execute()).rejects.toBe(failure);
    expect(reader.findCurrentOwned).not.toHaveBeenCalled();
  });

  it('does not query without an active Aquarium', async () => {
    const { review, context, reader } = setup();
    context.clear();

    await expect(review.execute()).rejects.toThrow(
      'Aquarium context is required',
    );
    expect(reader.findCurrentOwned).not.toHaveBeenCalled();
  });

  it('returns the latest value or an explicit missing value for every Parameter', async () => {
    const { review, reader } = setup();
    vi.mocked(reader.findCurrentOwned).mockImplementation(
      async (_ownerId, _aquariumId, parameterId) =>
        parameterId === 'temperature'
          ? {
              id: '123e4567-e89b-42d3-a456-426614174001' as never,
              parameterId,
              canonicalValue: 25.4,
              canonicalUnit: 'celsius',
              measuredAt: new Date('2026-08-09T10:00:00.000Z'),
              recordedAt: new Date('2026-08-09T10:01:00.000Z'),
              provenance: 'manual',
            }
          : null,
    );

    const values = await review.execute();

    expect(values).toHaveLength(5);
    expect(values).toContainEqual(
      expect.objectContaining({
        parameterId: 'temperature',
        canonicalValue: 25.4,
        canonicalUnit: 'celsius',
      }),
    );
    expect(values).toContainEqual({
      parameterId: 'phosphate',
      canonicalValue: null,
      canonicalUnit: null,
      measuredAt: null,
    });
    expect(reader.findCurrentOwned).toHaveBeenCalledTimes(5);
  });

  it('propagates an infrastructure failure instead of treating it as missing data', async () => {
    const { review, reader } = setup();
    const failure = new Error('Firestore unavailable');
    vi.mocked(reader.findCurrentOwned).mockRejectedValue(failure);

    await expect(review.execute()).rejects.toBe(failure);
  });
});
