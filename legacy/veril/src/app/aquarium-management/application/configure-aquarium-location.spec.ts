import { beforeEach, describe, expect, it, vi } from 'vitest';
import { aquariumIdFrom } from '../domain/aquarium';
import { ActiveAquariumContext } from '../../shared/application/active-aquarium-context';
import { ActiveAquariumContextStorage } from '../../shared/application/active-aquarium-context-storage';
import { AquariumLocationConfigurer, KeeperSession } from './ports';
import { ConfigureAquariumLocation } from './configure-aquarium-location';

const aquariumId = aquariumIdFrom('123e4567-e89b-42d3-a456-426614174000');
const location = {
  latitude: 28.12,
  longitude: -16.46,
  displayName: 'Santa Cruz de Tenerife, España',
};

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

describe('ConfigureAquariumLocation', () => {
  const configurer: AquariumLocationConfigurer = {
    configureLocation: vi.fn().mockResolvedValue(location),
  };
  const keeperSession: KeeperSession = {
    requireAuthenticatedKeeper: vi.fn().mockResolvedValue({ id: 'keeper-1' }),
  };

  beforeEach(() => vi.clearAllMocks());

  it('configures the confirmed location for the active Aquarium', async () => {
    await new ConfigureAquariumLocation(
      configurer,
      keeperSession,
      context(),
    ).execute(location);
    expect(configurer.configureLocation).toHaveBeenCalledWith({
      aquariumId,
      ownerKeeperId: 'keeper-1',
      location,
    });
  });

  it('requires authentication and Active Context', async () => {
    await expect(
      new ConfigureAquariumLocation(
        configurer,
        keeperSession,
        context(false),
      ).execute(location),
    ).rejects.toThrow('No active Aquarium');
    await expect(
      new ConfigureAquariumLocation(
        configurer,
        {
          requireAuthenticatedKeeper: vi
            .fn()
            .mockRejectedValue(new Error('Unauthenticated')),
        },
        context(),
      ).execute(location),
    ).rejects.toThrow('Unauthenticated');
    expect(configurer.configureLocation).not.toHaveBeenCalled();
  });
});
