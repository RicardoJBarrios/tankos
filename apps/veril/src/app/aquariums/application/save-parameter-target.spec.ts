import { describe, expect, it, vi } from 'vitest';
import { aquariumIdFrom } from '../domain/aquarium';
import { ActiveAquariumContext } from './active-aquarium-context';
import { ActiveAquariumContextStorage } from './active-aquarium-context-storage';
import { KeeperSession, ParameterTargetWriter } from './aquarium-ports';
import { RemoveParameterTarget } from './remove-parameter-target';
import { SaveParameterTarget } from './save-parameter-target';

const aquariumId = aquariumIdFrom('123e4567-e89b-42d3-a456-426614174000');

function context(selected = true): ActiveAquariumContext {
  const storage: ActiveAquariumContextStorage = {
    load: vi.fn(),
    save: vi.fn(),
    clear: vi.fn(),
  };
  const result = new ActiveAquariumContext(storage);
  if (selected) result.select(aquariumId);
  return result;
}

function setup(selected = true) {
  const writer: ParameterTargetWriter = {
    saveOwned: vi.fn(async (input) => input.target),
    removeOwned: vi.fn(),
  };
  const keeperSession: KeeperSession = {
    requireAuthenticatedKeeper: vi.fn().mockResolvedValue({ id: 'keeper-1' }),
  };
  const activeContext = context(selected);

  return {
    writer,
    keeperSession,
    save: new SaveParameterTarget(writer, keeperSession, activeContext),
    remove: new RemoveParameterTarget(writer, keeperSession, activeContext),
  };
}

describe('Parameter target application operations', () => {
  it('saves a target for the authenticated active Aquarium and supports editing', async () => {
    const { save, writer } = setup();

    await save.execute('temperature', 24, 25);
    await save.execute('temperature', 24.5, 25.5);

    expect(writer.saveOwned).toHaveBeenNthCalledWith(1, {
      aquariumId,
      ownerKeeperId: 'keeper-1',
      target: { parameterId: 'temperature', minimum: 24, maximum: 25 },
    });
    expect(writer.saveOwned).toHaveBeenNthCalledWith(2, {
      aquariumId,
      ownerKeeperId: 'keeper-1',
      target: { parameterId: 'temperature', minimum: 24.5, maximum: 25.5 },
    });
  });

  it('removes the target through the same owner-scoped capability boundary', async () => {
    const { remove, writer } = setup();

    await remove.execute('temperature');

    expect(writer.removeOwned).toHaveBeenCalledWith({
      aquariumId,
      ownerKeeperId: 'keeper-1',
      parameterId: 'temperature',
    });
  });

  it('rejects invalid values before persistence and requires authentication/context', async () => {
    const { save, writer } = setup();
    await expect(save.execute('temperature', 26, 25)).rejects.toThrow();
    expect(writer.saveOwned).not.toHaveBeenCalled();

    const withoutContext = setup(false);
    await expect(
      withoutContext.save.execute('temperature', 24, 25),
    ).rejects.toThrow('No active Aquarium');
    expect(withoutContext.writer.saveOwned).not.toHaveBeenCalled();

    const unauthenticated = setup();
    vi.mocked(
      unauthenticated.keeperSession.requireAuthenticatedKeeper,
    ).mockRejectedValueOnce(new Error('Unauthenticated'));
    await expect(
      unauthenticated.save.execute('temperature', 24, 25),
    ).rejects.toThrow('Unauthenticated');
    expect(unauthenticated.writer.saveOwned).not.toHaveBeenCalled();
  });
});
