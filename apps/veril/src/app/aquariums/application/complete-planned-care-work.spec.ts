import { describe, expect, it, vi } from 'vitest';
import { aquariumIdFrom } from '../domain/aquarium';
import { CareWork, careWorkIdFrom } from '../domain/care-work';
import { plannedCareWorkIdFrom } from '../domain/planned-care-work';
import { KeeperSession, PlannedCareWorkCompleter } from './aquarium-ports';
import { ActiveAquariumContext } from './active-aquarium-context';
import { CompletePlannedCareWork } from './complete-planned-care-work';

const aquariumId = aquariumIdFrom('123e4567-e89b-42d3-a456-426614174000');
const plannedId = plannedCareWorkIdFrom('123e4567-e89b-42d3-a456-426614174001');
const careWork: CareWork = {
  id: careWorkIdFrom(plannedId),
  aquariumId,
  description: 'Limpiar el skimmer',
  performedAt: new Date('2026-08-09T10:00:00.000Z'),
  recordedAt: new Date('2026-08-09T10:00:00.000Z'),
  provenance: 'manual',
};

describe('CompletePlannedCareWork', () => {
  it('completes the selected plan through the specific port', async () => {
    const completer: PlannedCareWorkCompleter = {
      complete: vi.fn().mockResolvedValue(careWork),
    };
    const keeperSession: KeeperSession = {
      requireAuthenticatedKeeper: vi.fn().mockResolvedValue({ id: 'keeper-1' }),
    };
    const context = new ActiveAquariumContext({
      load: vi.fn(),
      save: vi.fn(),
      clear: vi.fn(),
    });
    context.select(aquariumId);

    await expect(
      new CompletePlannedCareWork(completer, keeperSession, context).execute(
        plannedId,
      ),
    ).resolves.toEqual(careWork);
    expect(completer.complete).toHaveBeenCalledWith({
      id: plannedId,
      aquariumId,
      ownerKeeperId: 'keeper-1',
      completedAt: expect.any(Date),
    });
  });

  it('requires an authenticated keeper and Active Context', async () => {
    const completer: PlannedCareWorkCompleter = { complete: vi.fn() };
    const context = new ActiveAquariumContext({
      load: vi.fn(),
      save: vi.fn(),
      clear: vi.fn(),
    });
    await expect(
      new CompletePlannedCareWork(
        completer,
        {
          requireAuthenticatedKeeper: vi
            .fn()
            .mockRejectedValue(new Error('auth')),
        },
        context,
      ).execute(plannedId),
    ).rejects.toThrow('auth');

    const keeperSession: KeeperSession = {
      requireAuthenticatedKeeper: vi.fn().mockResolvedValue({ id: 'keeper-1' }),
    };
    await expect(
      new CompletePlannedCareWork(completer, keeperSession, context).execute(
        plannedId,
      ),
    ).rejects.toThrow('Aquarium context is required');
    expect(completer.complete).not.toHaveBeenCalled();
  });
});
