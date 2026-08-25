import { describe, expect, it, vi } from 'vitest';
import { aquariumIdFrom } from '../../shared/domain/aquarium-reference';
import { ActiveAquariumContext } from '../../shared/application/active-aquarium-context';
import { ActiveAquariumContextStorage } from '../../shared/application/active-aquarium-context-storage';
import { KeeperSession, PlannedCareWorkReader } from './ports';
import { ListPlannedCareWork } from './list-planned-care-work';

const aquariumId = aquariumIdFrom('123e4567-e89b-42d3-a456-426614174000');
const item = {
  id: '123e4567-e89b-42d3-a456-426614174001' as never,
  description: 'Limpiar el skimmer',
  plannedFor: new Date('2026-08-10T10:00:00.000Z'),
  recordedAt: new Date('2026-08-09T10:00:00.000Z'),
  provenance: 'manual' as const,
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
    vi.mocked(reader.listOwned).mockResolvedValue({ items: [item] });

    await expect(
      new ListPlannedCareWork(reader, keeperSession, context).execute(),
    ).resolves.toEqual({ items: [item] });
    expect(reader.listOwned).toHaveBeenCalledWith(
      'keeper-a',
      aquariumId,
      undefined,
      undefined,
    );
  });

  it('passes a smaller preview limit without changing ordering semantics', async () => {
    context.select(aquariumId);
    vi.mocked(reader.listOwned).mockResolvedValue({ items: [item] });

    await new ListPlannedCareWork(reader, keeperSession, context).execute(
      undefined,
      3,
    );

    expect(reader.listOwned).toHaveBeenCalledWith(
      'keeper-a',
      aquariumId,
      undefined,
      3,
    );
  });
});
