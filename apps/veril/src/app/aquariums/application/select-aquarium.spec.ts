import { describe, expect, it, vi } from 'vitest';
import { AquariumName, aquariumIdFrom } from '../domain/aquarium';
import { ActiveAquariumContext } from './active-aquarium-context';
import { ActiveAquariumContextStorage } from './active-aquarium-context-storage';
import { AquariumReader, KeeperSession } from './aquarium-ports';
import { SelectAquarium } from './select-aquarium';

const selectedId = aquariumIdFrom('123e4567-e89b-42d3-a456-426614174000');
const otherId = aquariumIdFrom('123e4567-e89b-42d3-a456-426614174001');

const selectedAquarium = {
  id: selectedId,
  name: AquariumName.create('Veril'),
};

function createContext(): ActiveAquariumContext {
  const storage: ActiveAquariumContextStorage = {
    load: vi.fn(),
    save: vi.fn(),
    clear: vi.fn(),
  };
  return new ActiveAquariumContext(storage);
}

function setup() {
  const reader: AquariumReader = {
    listOwned: vi.fn(),
    getOwned: vi.fn().mockResolvedValue(selectedAquarium),
  };
  const keeperSession: KeeperSession = {
    requireAuthenticatedKeeper: vi.fn().mockResolvedValue({ id: 'keeper-a' }),
  };
  const context = createContext();

  return {
    reader,
    keeperSession,
    context,
    select: new SelectAquarium(reader, keeperSession, context),
  };
}

describe('SelectAquarium', () => {
  it('verifies ownership before establishing Active Context', async () => {
    const { select, reader, context } = setup();

    await select.execute(selectedId);

    expect(reader.getOwned).toHaveBeenCalledWith('keeper-a', selectedId);
    expect(context.get()).toBe(selectedId);
  });

  it('replaces the current selection', async () => {
    const { select, reader, context } = setup();
    vi.mocked(reader.getOwned)
      .mockResolvedValueOnce(selectedAquarium)
      .mockResolvedValueOnce({
        id: otherId,
        name: AquariumName.create('Otro'),
      });

    await select.execute(selectedId);
    await select.execute(otherId);

    expect(context.get()).toBe(otherId);
  });

  it('does not read again when selecting the already active Aquarium', async () => {
    const { select, reader, context } = setup();
    context.select(selectedId);

    await select.execute(selectedId);

    expect(reader.getOwned).not.toHaveBeenCalled();
    expect(context.get()).toBe(selectedId);
  });

  it('clears context when the Aquarium is unavailable', async () => {
    const { select, reader, context } = setup();
    context.select(selectedId);
    vi.mocked(reader.getOwned).mockResolvedValue(null);

    await expect(select.execute(otherId)).rejects.toThrow(
      'Aquarium unavailable',
    );
    expect(context.get()).toBeNull();
  });

  it('does not establish context after authentication failure', async () => {
    const { select, keeperSession, reader, context } = setup();
    const failure = new Error('Authentication unavailable');
    vi.mocked(keeperSession.requireAuthenticatedKeeper).mockRejectedValue(
      failure,
    );

    await expect(select.execute(selectedId)).rejects.toBe(failure);
    expect(reader.getOwned).not.toHaveBeenCalled();
    expect(context.get()).toBeNull();
  });

  it('keeps the previous context when infrastructure fails', async () => {
    const { select, reader, context } = setup();
    context.select(selectedId);
    const failure = new Error('Firestore unavailable');
    vi.mocked(reader.getOwned).mockRejectedValue(failure);

    await expect(select.execute(otherId)).rejects.toBe(failure);
    expect(context.get()).toBe(selectedId);
  });
});
