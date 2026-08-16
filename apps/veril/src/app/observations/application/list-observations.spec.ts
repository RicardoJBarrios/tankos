import { describe, expect, it, vi } from 'vitest';
import { aquariumIdFrom } from '../../shared/domain/aquarium-reference';
import { ActiveAquariumContext } from '../../shared/application/active-aquarium-context';
import { ActiveAquariumContextStorage } from '../../shared/application/active-aquarium-context-storage';
import { KeeperSession, ObservationReader } from './ports';
import { ListObservations } from './list-observations';

const aquariumId = aquariumIdFrom('123e4567-e89b-42d3-a456-426614174000');

function setup() {
  const reader: ObservationReader = { listOwned: vi.fn() };
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
    list: new ListObservations(reader, keeperSession, context),
  };
}

describe('ListObservations', () => {
  it('requires an authenticated keeper', async () => {
    const { list, keeperSession, reader } = setup();
    const failure = new Error('Authentication unavailable');
    vi.mocked(keeperSession.requireAuthenticatedKeeper).mockRejectedValue(
      failure,
    );

    await expect(list.execute()).rejects.toBe(failure);
    expect(reader.listOwned).not.toHaveBeenCalled();
  });

  it('does not query without an active Aquarium', async () => {
    const { list, context, reader } = setup();
    context.clear();

    await expect(list.execute()).rejects.toThrow(
      'Aquarium context is required',
    );
    expect(reader.listOwned).not.toHaveBeenCalled();
  });

  it('returns the ordered read model from the active Aquarium', async () => {
    const { list, reader } = setup();
    const items = [
      {
        id: '123e4567-e89b-42d3-a456-426614174001' as never,
        content: 'El coral está abierto',
        recordedAt: new Date('2026-08-08T10:00:00.000Z'),
      },
      {
        id: '123e4567-e89b-42d3-a456-426614174002' as never,
        content: 'La bomba hace ruido',
        recordedAt: new Date('2026-08-07T10:00:00.000Z'),
      },
    ];
    vi.mocked(reader.listOwned).mockResolvedValue(items);

    await expect(list.execute()).resolves.toBe(items);
    expect(reader.listOwned).toHaveBeenCalledWith('keeper-a', aquariumId);
  });

  it('returns an empty result', async () => {
    const { list, reader } = setup();
    vi.mocked(reader.listOwned).mockResolvedValue([]);

    await expect(list.execute()).resolves.toEqual([]);
  });

  it('propagates infrastructure failures', async () => {
    const { list, reader } = setup();
    const failure = new Error('Firestore unavailable');
    vi.mocked(reader.listOwned).mockRejectedValue(failure);

    await expect(list.execute()).rejects.toBe(failure);
  });
});
