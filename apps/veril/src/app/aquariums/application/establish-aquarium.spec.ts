import { describe, expect, it, vi } from 'vitest';
import {
  EstablishAquariumInput,
  AquariumRepository,
  KeeperSession,
} from './aquarium-ports';
import { EstablishAquarium } from './establish-aquarium';

describe('EstablishAquarium', () => {
  it('creates a new Aquarium for an authenticated keeper', async () => {
    const keeperSession: KeeperSession = {
      requireAuthenticatedKeeper: vi.fn().mockResolvedValue({ id: 'keeper-a' }),
    };
    const repository: AquariumRepository = {
      establish: vi
        .fn()
        .mockImplementation(async (input: EstablishAquariumInput) => ({
          id: input.id,
          name: input.name,
          ownerKeeperId: input.ownerKeeperId,
          establishedAt: input.establishedAt,
        })),
    };

    const result = await new EstablishAquarium(
      repository,
      keeperSession,
    ).execute('Veril');

    expect(result.name.value).toBe('Veril');
    expect(result.ownerKeeperId).toBe('keeper-a');
    expect(repository.establish).toHaveBeenCalledOnce();
  });

  it('allows the same keeper to establish a second independent Aquarium', async () => {
    const repository: AquariumRepository = {
      establish: vi
        .fn()
        .mockImplementation(async (input: EstablishAquariumInput) => ({
          id: input.id,
          name: input.name,
          ownerKeeperId: input.ownerKeeperId,
          establishedAt: input.establishedAt,
        })),
    };

    const useCase = new EstablishAquarium(repository, {
      requireAuthenticatedKeeper: async () => ({ id: 'keeper-a' }),
    });
    const first = await useCase.execute('Acuario A');
    const second = await useCase.execute('Acuario B');

    expect(first.id).not.toBe(second.id);
    expect(repository.establish).toHaveBeenCalledTimes(2);
  });
});
