import { describe, expect, it, vi } from 'vitest';
import { aquariumIdFrom } from '../domain/aquarium';
import { ActiveAquariumContext } from './active-aquarium-context';
import { ActiveAquariumContextStorage } from './active-aquarium-context-storage';
import { KeeperSession, PlannedCareWorkReader } from './aquarium-ports';
import {
  ListPlannedCareWork,
  PLANNED_CARE_WORK_LIMIT,
} from './list-planned-care-work';

const aquariumId = aquariumIdFrom('123e4567-e89b-42d3-a456-426614174000');
const item = {
  id: '123e4567-e89b-42d3-a456-426614174001' as never,
  description: 'Limpiar el skimmer',
  plannedFor: new Date('2026-08-10T10:00:00.000Z'),
  recordedAt: new Date('2026-08-09T10:00:00.000Z'),
};

describe('ListPlannedCareWork', () => {
  const reader: PlannedCareWorkReader = { listOwned: vi.fn() };
  const keeperSession: KeeperSession = {
    requireAuthenticatedKeeper: vi.fn().mockResolvedValue({ id: 'keeper-a' }),
  };
  const context = new ActiveAquariumContext({
    load: vi.fn(),
    save: vi.fn(),
    clear: vi.fn(),
  } satisfies ActiveAquariumContextStorage);

  it('requires Active Context before reading', async () => {
    await expect(
      new ListPlannedCareWork(reader, keeperSession, context).execute(),
    ).rejects.toThrow('Aquarium context is required');
    expect(reader.listOwned).not.toHaveBeenCalled();
  });

  it('returns the bounded planned work for the active Aquarium', async () => {
    context.select(aquariumId);
    vi.mocked(reader.listOwned).mockResolvedValue([item]);

    await expect(
      new ListPlannedCareWork(reader, keeperSession, context).execute(),
    ).resolves.toEqual([item]);
    expect(reader.listOwned).toHaveBeenCalledWith(
      'keeper-a',
      aquariumId,
      PLANNED_CARE_WORK_LIMIT,
    );
  });

  it('passes a smaller preview limit without changing ordering semantics', async () => {
    context.select(aquariumId);
    vi.mocked(reader.listOwned).mockResolvedValue([item]);

    await new ListPlannedCareWork(reader, keeperSession, context).execute(3);

    expect(reader.listOwned).toHaveBeenCalledWith('keeper-a', aquariumId, 3);
  });
});
