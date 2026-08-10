import { beforeEach, describe, expect, it, vi } from 'vitest';
import { aquariumIdFrom } from '../domain/aquarium';
import { ActiveAquariumContext } from './active-aquarium-context';
import { ActiveAquariumContextStorage } from './active-aquarium-context-storage';
import { AquariumTimeZoneConfigurer, KeeperSession } from './aquarium-ports';
import { ConfigureAquariumTimeZone } from './configure-aquarium-time-zone';

const aquariumId = aquariumIdFrom('123e4567-e89b-42d3-a456-426614174000');
const timeZone = 'Atlantic/Canary';

function createContext(selected = true): ActiveAquariumContext {
  const storage: ActiveAquariumContextStorage = {
    load: vi.fn(),
    save: vi.fn(),
    clear: vi.fn(),
  };
  const context = new ActiveAquariumContext(storage);
  if (selected) context.select(aquariumId);
  return context;
}

describe('ConfigureAquariumTimeZone', () => {
  const configurer: AquariumTimeZoneConfigurer = {
    configure: vi.fn().mockResolvedValue(timeZone),
  };
  const keeperSession: KeeperSession = {
    requireAuthenticatedKeeper: vi.fn().mockResolvedValue({ id: 'keeper-1' }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('configures a valid timezone for the active Aquarium owner', async () => {
    const result = await new ConfigureAquariumTimeZone(
      configurer,
      keeperSession,
      createContext(),
    ).execute(timeZone);

    expect(result).toBe(timeZone);
    expect(configurer.configure).toHaveBeenCalledWith({
      aquariumId,
      ownerKeeperId: 'keeper-1',
      timeZone,
    });
  });

  it('rejects an invalid timezone before persistence', async () => {
    await expect(
      new ConfigureAquariumTimeZone(
        configurer,
        keeperSession,
        createContext(),
      ).execute('Not/A_Timezone'),
    ).rejects.toThrow();
    expect(configurer.configure).not.toHaveBeenCalled();
  });

  it('requires authentication and Active Context', async () => {
    const unauthenticated: KeeperSession = {
      requireAuthenticatedKeeper: vi
        .fn()
        .mockRejectedValue(new Error('Unauthenticated')),
    };
    await expect(
      new ConfigureAquariumTimeZone(
        configurer,
        unauthenticated,
        createContext(),
      ).execute(timeZone),
    ).rejects.toThrow('Unauthenticated');

    await expect(
      new ConfigureAquariumTimeZone(
        configurer,
        keeperSession,
        createContext(false),
      ).execute(timeZone),
    ).rejects.toThrow('No active Aquarium');
  });

  it('propagates an already-configured rejection', async () => {
    vi.mocked(configurer.configure).mockRejectedValueOnce(
      new Error('Aquarium time zone is already configured'),
    );

    await expect(
      new ConfigureAquariumTimeZone(
        configurer,
        keeperSession,
        createContext(),
      ).execute(timeZone),
    ).rejects.toThrow('already configured');
  });
});
