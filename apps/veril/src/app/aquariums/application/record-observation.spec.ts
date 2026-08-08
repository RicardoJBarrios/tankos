import { describe, expect, it, vi } from 'vitest';
import { aquariumIdFrom } from '../domain/aquarium';
import { ActiveAquariumContext } from './active-aquarium-context';
import { ActiveAquariumContextStorage } from './active-aquarium-context-storage';
import { KeeperSession, ObservationWriter } from './aquarium-ports';
import { RecordObservation } from './record-observation';

const aquariumId = aquariumIdFrom('123e4567-e89b-42d3-a456-426614174000');

function createContext(): ActiveAquariumContext {
  const storage: ActiveAquariumContextStorage = {
    load: vi.fn(),
    save: vi.fn(),
    clear: vi.fn(),
  };
  return new ActiveAquariumContext(storage);
}

function setup() {
  const writer: ObservationWriter = { record: vi.fn() };
  const keeperSession: KeeperSession = {
    requireAuthenticatedKeeper: vi.fn().mockResolvedValue({ id: 'keeper-a' }),
  };
  const context = createContext();
  context.select(aquariumId);

  return {
    writer,
    keeperSession,
    context,
    record: new RecordObservation(writer, keeperSession, context),
  };
}

describe('RecordObservation', () => {
  it('records qualitative evidence in the active Aquarium', async () => {
    const { record, writer } = setup();
    vi.mocked(writer.record).mockImplementation(async (input) => input);

    const result = await record.execute('  El coral está abierto  ');

    expect(writer.record).toHaveBeenCalledWith(
      expect.objectContaining({
        aquariumId,
        ownerKeeperId: 'keeper-a',
        content: 'El coral está abierto',
        recordedAt: expect.any(Date),
      }),
    );
    expect(result.content).toBe('El coral está abierto');
  });

  it('rejects recording without an active Aquarium', async () => {
    const { record, context, writer } = setup();
    context.clear();

    await expect(record.execute('Algo observado')).rejects.toThrow(
      'Aquarium context is required',
    );
    expect(writer.record).not.toHaveBeenCalled();
  });

  it('rejects empty content before persistence', async () => {
    const { record, writer } = setup();

    await expect(record.execute('   ')).rejects.toThrow(
      'Observation content must not be empty',
    );
    expect(writer.record).not.toHaveBeenCalled();
  });

  it('propagates authentication and infrastructure failures', async () => {
    const { record, keeperSession, writer } = setup();
    const authFailure = new Error('Authentication unavailable');
    vi.mocked(keeperSession.requireAuthenticatedKeeper).mockRejectedValue(
      authFailure,
    );

    await expect(record.execute('Algo observado')).rejects.toBe(authFailure);
    expect(writer.record).not.toHaveBeenCalled();

    vi.mocked(keeperSession.requireAuthenticatedKeeper).mockResolvedValue({
      id: 'keeper-a',
    });
    const infrastructureFailure = new Error('Firestore unavailable');
    vi.mocked(writer.record).mockRejectedValue(infrastructureFailure);

    await expect(record.execute('Algo observado')).rejects.toBe(
      infrastructureFailure,
    );
  });
});
