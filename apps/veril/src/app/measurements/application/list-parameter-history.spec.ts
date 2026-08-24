import { describe, expect, it, vi } from 'vitest';
import { ActiveAquariumContext } from '../../shared/application/active-aquarium-context';
import { aquariumIdFrom } from '../../shared/domain/aquarium-reference';
import { ListParameterHistory } from './list-parameter-history';
import { ParameterHistoryReader } from './ports';

const aquariumId = aquariumIdFrom('123e4567-e89b-42d3-a456-426614174000');

function context(): ActiveAquariumContext {
  return new ActiveAquariumContext({
    load: () => aquariumId,
    save: vi.fn(),
    clear: vi.fn(),
  });
}

describe('ListParameterHistory', () => {
  it('requires a valid interval before querying', async () => {
    const reader: ParameterHistoryReader = { listOwnedHistory: vi.fn() };
    const useCase = new ListParameterHistory(
      reader,
      { requireAuthenticatedKeeper: vi.fn() },
      context(),
    );

    await expect(
      useCase.execute({
        parameterId: 'temperature',
        from: new Date('2026-08-02T00:00:00Z'),
        to: new Date('2026-08-01T00:00:00Z'),
      }),
    ).rejects.toThrow('interval is invalid');
    expect(reader.listOwnedHistory).not.toHaveBeenCalled();
  });

  it('passes the selected filter and context to the reader', async () => {
    const listOwnedHistory = vi.fn().mockResolvedValue({ items: [] });
    const useCase = new ListParameterHistory(
      { listOwnedHistory },
      {
        requireAuthenticatedKeeper: vi
          .fn()
          .mockResolvedValue({ id: 'keeper-1' }),
      },
      context(),
    );
    const filter = {
      parameterId: 'salinity' as const,
      from: new Date('2026-08-01T00:00:00Z'),
    };

    await useCase.execute(filter, undefined, 10);

    expect(listOwnedHistory).toHaveBeenCalledWith(
      'keeper-1',
      aquariumId,
      filter,
      undefined,
      10,
    );
  });
});
