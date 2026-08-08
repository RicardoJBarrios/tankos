import { describe, expect, it, vi } from 'vitest';
import { AquariumName, aquariumIdFrom } from '../domain/aquarium';
import { ActiveAquariumContext } from './active-aquarium-context';
import { ActiveAquariumContextStorage } from './active-aquarium-context-storage';
import { AquariumReader, KeeperSession } from './aquarium-ports';
import { RestoreActiveAquarium } from './restore-active-aquarium';

const aquariumId = aquariumIdFrom('123e4567-e89b-42d3-a456-426614174000');

function setup(storedId: string | null) {
  const storage: ActiveAquariumContextStorage = {
    load: vi.fn().mockReturnValue(storedId),
    save: vi.fn(),
    clear: vi.fn(),
  };
  const context = new ActiveAquariumContext(storage);
  const reader: AquariumReader = {
    listOwned: vi.fn(),
    getOwned: vi.fn().mockResolvedValue({
      id: aquariumId,
      name: AquariumName.create('Veril'),
    }),
  };
  const keeperSession: KeeperSession = {
    requireAuthenticatedKeeper: vi.fn().mockResolvedValue({ id: 'keeper-a' }),
  };

  return {
    storage,
    context,
    reader,
    keeperSession,
    restore: new RestoreActiveAquarium(reader, keeperSession, context, storage),
  };
}

describe('RestoreActiveAquarium', () => {
  it('restores a stored Aquarium only after ownership is verified', async () => {
    const { restore, context, reader, keeperSession } = setup(aquariumId);

    await restore.execute();

    expect(keeperSession.requireAuthenticatedKeeper).toHaveBeenCalledOnce();
    expect(reader.getOwned).toHaveBeenCalledWith('keeper-a', aquariumId);
    expect(context.get()).toBe(aquariumId);
  });

  it('does not authenticate when there is no stored context', async () => {
    const { restore, reader, keeperSession } = setup(null);

    await restore.execute();

    expect(keeperSession.requireAuthenticatedKeeper).not.toHaveBeenCalled();
    expect(reader.getOwned).not.toHaveBeenCalled();
  });

  it('clears malformed stored context', async () => {
    const { restore, context, storage } = setup('not-an-aquarium-id');

    await restore.execute();

    expect(context.get()).toBeNull();
    expect(storage.clear).toHaveBeenCalledOnce();
  });

  it('clears the hint when the restored identity no longer owns the Aquarium', async () => {
    const { restore, context, reader, storage, keeperSession } =
      setup(aquariumId);
    vi.mocked(keeperSession.requireAuthenticatedKeeper).mockResolvedValue({
      id: 'keeper-b',
    });
    vi.mocked(reader.getOwned).mockResolvedValue(null);

    await restore.execute();

    expect(reader.getOwned).toHaveBeenCalledWith('keeper-b', aquariumId);
    expect(context.get()).toBeNull();
    expect(storage.clear).toHaveBeenCalledOnce();
  });

  it('clears the hint when restoration infrastructure fails', async () => {
    const { restore, context, reader, storage } = setup(aquariumId);
    vi.mocked(reader.getOwned).mockRejectedValue(
      new Error('Firestore unavailable'),
    );

    await restore.execute();

    expect(context.get()).toBeNull();
    expect(storage.clear).toHaveBeenCalledOnce();
  });
});
