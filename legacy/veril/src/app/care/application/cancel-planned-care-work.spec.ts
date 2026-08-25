import { describe, expect, it, vi } from 'vitest';
import { aquariumIdFrom } from '../../shared/domain/aquarium-reference';
import { plannedCareWorkIdFrom } from '../domain/planned-care-work';
import { ActiveAquariumContext } from '../../shared/application/active-aquarium-context';
import { KeeperSession, PlannedCareWorkCanceller } from './ports';
import { CancelPlannedCareWork } from './cancel-planned-care-work';

const aquariumId = aquariumIdFrom('123e4567-e89b-42d3-a456-426614174000');
const plannedId = plannedCareWorkIdFrom('123e4567-e89b-42d3-a456-426614174001');

function createContext() {
  return new ActiveAquariumContext({
    load: vi.fn(),
    save: vi.fn(),
    clear: vi.fn(),
  });
}

describe('CancelPlannedCareWork', () => {
  it('cancels the selected plan through the specific port', async () => {
    const canceller: PlannedCareWorkCanceller = { cancel: vi.fn() };
    const keeperSession: KeeperSession = {
      requireAuthenticatedKeeper: vi.fn().mockResolvedValue({ id: 'keeper-1' }),
    };
    const activeContext = createContext();
    activeContext.select(aquariumId);

    await new CancelPlannedCareWork(
      canceller,
      keeperSession,
      activeContext,
    ).execute(plannedId);

    expect(canceller.cancel).toHaveBeenCalledWith(
      expect.objectContaining({
        id: plannedId,
        aquariumId,
        ownerKeeperId: 'keeper-1',
        actionAt: expect.any(Date),
      }),
    );
  });

  it('requires authentication and Active Context', async () => {
    const canceller: PlannedCareWorkCanceller = { cancel: vi.fn() };
    const activeContext = createContext();
    const unauthenticated = new CancelPlannedCareWork(
      canceller,
      {
        requireAuthenticatedKeeper: vi
          .fn()
          .mockRejectedValue(new Error('auth')),
      },
      activeContext,
    );

    await expect(unauthenticated.execute(plannedId)).rejects.toThrow('auth');

    const keeperSession: KeeperSession = {
      requireAuthenticatedKeeper: vi.fn().mockResolvedValue({ id: 'keeper-1' }),
    };
    await expect(
      new CancelPlannedCareWork(
        canceller,
        keeperSession,
        activeContext,
      ).execute(plannedId),
    ).rejects.toThrow('Aquarium context is required');
    expect(canceller.cancel).not.toHaveBeenCalled();
  });
});
