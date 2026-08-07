import { describe, expect, it, vi } from 'vitest';
import {
  AquariumListItem,
  AquariumReader,
  KeeperSession,
} from './aquarium-ports';
import { ListMyAquariums } from './list-my-aquariums';
import { aquariumIdFrom } from '../domain/aquarium-id';
import { AquariumName } from '../domain/aquarium-name';

const item = (id: string, name: string): AquariumListItem => ({
  id: aquariumIdFrom(id),
  name: AquariumName.create(name),
});

describe('ListMyAquariums', () => {
  it('returns an empty list for an authenticated keeper with no Aquariums', async () => {
    const reader: AquariumReader = {
      listOwned: vi.fn().mockResolvedValue([]),
      getOwned: vi.fn(),
    };
    const session: KeeperSession = {
      requireAuthenticatedKeeper: vi.fn().mockResolvedValue({ id: 'keeper-a' }),
    };

    const result = await new ListMyAquariums(reader, session).execute();

    expect(result).toEqual([]);
  });

  it('returns one or many items for the authenticated keeper', async () => {
    const expected = [
      item('123e4567-e89b-42d3-a456-426614174000', 'Más reciente'),
      item('123e4567-e89b-42d3-a456-426614174001', 'Anterior'),
    ];
    const reader: AquariumReader = {
      listOwned: vi.fn().mockResolvedValue(expected),
      getOwned: vi.fn(),
    };
    const session: KeeperSession = {
      requireAuthenticatedKeeper: vi.fn().mockResolvedValue({ id: 'keeper-a' }),
    };

    const result = await new ListMyAquariums(reader, session).execute();

    expect(result).toEqual(expected);
    expect(reader.listOwned).toHaveBeenCalledWith('keeper-a');
  });

  it('propagates authentication failure without querying the reader', async () => {
    const reader: AquariumReader = { listOwned: vi.fn(), getOwned: vi.fn() };
    const failure = new Error('Authentication unavailable');
    const session: KeeperSession = {
      requireAuthenticatedKeeper: vi.fn().mockRejectedValue(failure),
    };

    await expect(new ListMyAquariums(reader, session).execute()).rejects.toBe(
      failure,
    );
    expect(reader.listOwned).not.toHaveBeenCalled();
  });

  it('propagates infrastructure failure', async () => {
    const failure = new Error('Firestore unavailable');
    const reader: AquariumReader = {
      listOwned: vi.fn().mockRejectedValue(failure),
      getOwned: vi.fn(),
    };
    const session: KeeperSession = {
      requireAuthenticatedKeeper: vi.fn().mockResolvedValue({ id: 'keeper-a' }),
    };

    await expect(new ListMyAquariums(reader, session).execute()).rejects.toBe(
      failure,
    );
  });
});
