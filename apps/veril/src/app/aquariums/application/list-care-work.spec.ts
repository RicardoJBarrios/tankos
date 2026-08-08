import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ActiveAquariumContext } from './active-aquarium-context';
import { ActiveAquariumContextStorage } from './active-aquarium-context-storage';
import { CareWorkReader, KeeperSession } from './aquarium-ports';
import { CARE_WORK_HISTORY_LIMIT, ListCareWork } from './list-care-work';
import { aquariumIdFrom } from '../domain/aquarium';
import { careWorkIdFrom } from '../domain/care-work';

const aquariumId = aquariumIdFrom('123e4567-e89b-42d3-a456-426614174000');
const item = {
  id: careWorkIdFrom('123e4567-e89b-42d3-a456-426614174001'),
  description: 'Limpié la copa del skimmer',
  performedAt: new Date('2026-08-08T10:00:00.000Z'),
  recordedAt: new Date('2026-08-08T10:05:00.000Z'),
};

describe('ListCareWork', () => {
  const reader: CareWorkReader = { listRecentOwned: vi.fn() };
  const keeperSession: KeeperSession = {
    requireAuthenticatedKeeper: vi.fn(),
  };
  let context: ActiveAquariumContext;

  beforeEach(() => {
    vi.resetAllMocks();
    context = new ActiveAquariumContext({
      load: vi.fn(),
      save: vi.fn(),
      clear: vi.fn(),
    } satisfies ActiveAquariumContextStorage);
  });

  function createUseCase(): ListCareWork {
    return new ListCareWork(reader, keeperSession, context);
  }

  it('requires authentication before reading', async () => {
    vi.mocked(keeperSession.requireAuthenticatedKeeper).mockRejectedValue(
      new Error('unauthenticated'),
    );

    await expect(createUseCase().execute()).rejects.toThrow('unauthenticated');
    expect(reader.listRecentOwned).not.toHaveBeenCalled();
  });

  it('requires Active Context without querying', async () => {
    vi.mocked(keeperSession.requireAuthenticatedKeeper).mockResolvedValue({
      id: 'keeper-1',
    });

    await expect(createUseCase().execute()).rejects.toThrow(
      'Aquarium context is required',
    );
    expect(reader.listRecentOwned).not.toHaveBeenCalled();
  });

  it('requests the bounded recent history for the active Aquarium', async () => {
    context.select(aquariumId);
    vi.mocked(keeperSession.requireAuthenticatedKeeper).mockResolvedValue({
      id: 'keeper-1',
    });
    vi.mocked(reader.listRecentOwned).mockResolvedValue([item]);

    await expect(createUseCase().execute()).resolves.toEqual([item]);
    expect(reader.listRecentOwned).toHaveBeenCalledWith(
      'keeper-1',
      aquariumId,
      CARE_WORK_HISTORY_LIMIT,
    );
  });

  it('treats an empty history as a successful result', async () => {
    context.select(aquariumId);
    vi.mocked(keeperSession.requireAuthenticatedKeeper).mockResolvedValue({
      id: 'keeper-1',
    });
    vi.mocked(reader.listRecentOwned).mockResolvedValue([]);

    await expect(createUseCase().execute()).resolves.toEqual([]);
  });

  it('propagates reader failures', async () => {
    context.select(aquariumId);
    vi.mocked(keeperSession.requireAuthenticatedKeeper).mockResolvedValue({
      id: 'keeper-1',
    });
    vi.mocked(reader.listRecentOwned).mockRejectedValue(new Error('offline'));

    await expect(createUseCase().execute()).rejects.toThrow('offline');
  });
});
