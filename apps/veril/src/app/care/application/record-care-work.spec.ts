import { describe, expect, it, vi } from 'vitest';
import { aquariumIdFrom } from '../../shared/domain/aquarium-reference';
import { ActiveAquariumContext } from '../../shared/application/active-aquarium-context';
import { ActiveAquariumContextStorage } from '../../shared/application/active-aquarium-context-storage';
import { CareWorkWriter, KeeperSession } from './ports';
import { RecordCareWork } from './record-care-work';

const aquariumId = aquariumIdFrom('123e4567-e89b-42d3-a456-426614174000');
const performedAt = new Date('2026-08-08T10:00:00.000Z');

function setup() {
  const writer: CareWorkWriter = { record: vi.fn() };
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
    writer,
    keeperSession,
    context,
    record: new RecordCareWork(writer, keeperSession, context),
  };
}

describe('RecordCareWork', () => {
  it('records completed care in the active Aquarium', async () => {
    const { record, writer } = setup();
    vi.mocked(writer.record).mockImplementation(async (input) => input);

    const result = await record.execute('  Limpié la copa  ', performedAt);

    expect(writer.record).toHaveBeenCalledWith(
      expect.objectContaining({
        aquariumId,
        ownerKeeperId: 'keeper-a',
        description: 'Limpié la copa',
        performedAt,
        provenance: 'manual',
        recordedAt: expect.any(Date),
      }),
    );
    expect(result.description).toBe('Limpié la copa');
  });

  it('does not write without an active Aquarium', async () => {
    const { record, context, writer } = setup();
    context.clear();

    await expect(record.execute('Limpié la copa', performedAt)).rejects.toThrow(
      'Aquarium context is required',
    );
    expect(writer.record).not.toHaveBeenCalled();
  });

  it('rejects invalid input before persistence', async () => {
    const { record, writer } = setup();

    await expect(record.execute('   ', performedAt)).rejects.toThrow(
      'description',
    );
    await expect(
      record.execute('Limpieza', new Date('invalid')),
    ).rejects.toThrow('performedAt');
    expect(writer.record).not.toHaveBeenCalled();
  });

  it('propagates authentication and infrastructure failures', async () => {
    const { record, keeperSession, writer } = setup();
    const authFailure = new Error('Authentication unavailable');
    vi.mocked(keeperSession.requireAuthenticatedKeeper).mockRejectedValue(
      authFailure,
    );
    await expect(record.execute('Limpieza', performedAt)).rejects.toBe(
      authFailure,
    );
    expect(writer.record).not.toHaveBeenCalled();

    vi.mocked(keeperSession.requireAuthenticatedKeeper).mockResolvedValue({
      id: 'keeper-a',
    });
    const infrastructureFailure = new Error('Firestore unavailable');
    vi.mocked(writer.record).mockRejectedValue(infrastructureFailure);
    await expect(record.execute('Limpieza', performedAt)).rejects.toBe(
      infrastructureFailure,
    );
  });
});
