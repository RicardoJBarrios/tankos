import { describe, expect, it, vi } from 'vitest';
import { aquariumIdFrom } from '../domain/aquarium-id';
import { ActiveAquariumContext } from './active-aquarium-context';
import { KeeperSession, MeasurementWriter } from './aquarium-ports';
import { RecordMeasurement } from './record-measurement';

const aquariumId = aquariumIdFrom('123e4567-e89b-42d3-a456-426614174000');
const measuredAt = new Date('2026-08-08T10:00:00.000Z');

function setup() {
  const writer: MeasurementWriter = { record: vi.fn() };
  const keeperSession: KeeperSession = {
    requireAuthenticatedKeeper: vi.fn().mockResolvedValue({ id: 'keeper-a' }),
  };
  const context = new ActiveAquariumContext();
  context.select(aquariumId);

  return {
    writer,
    keeperSession,
    context,
    record: new RecordMeasurement(writer, keeperSession, context),
  };
}

describe('RecordMeasurement', () => {
  it('records a manual Measurement in the active Aquarium', async () => {
    const { record, writer } = setup();
    vi.mocked(writer.record).mockImplementation(async (input) => input);

    const result = await record.execute('temperature', 23.5, measuredAt);

    expect(writer.record).toHaveBeenCalledWith(
      expect.objectContaining({
        aquariumId,
        ownerKeeperId: 'keeper-a',
        parameterId: 'temperature',
        enteredValue: 23.5,
        enteredUnit: 'celsius',
        canonicalValue: 23.5,
        canonicalUnit: 'celsius',
        measuredAt,
        provenance: 'manual',
      }),
    );
    expect(result.parameterId).toBe('temperature');
  });

  it('rejects recording without an active Aquarium', async () => {
    const { record, context, writer } = setup();
    context.clear();

    await expect(
      record.execute('temperature', 23.5, measuredAt),
    ).rejects.toThrow('Aquarium context is required');
    expect(writer.record).not.toHaveBeenCalled();
  });

  it('rejects unsupported parameters and invalid values before persistence', async () => {
    const { record, writer } = setup();

    await expect(
      record.execute('conductivity' as never, 1, measuredAt),
    ).rejects.toThrow();
    await expect(
      record.execute('temperature', -1, measuredAt),
    ).rejects.toThrow();
    expect(writer.record).not.toHaveBeenCalled();
  });

  it('propagates authentication and infrastructure failures', async () => {
    const { record, keeperSession, writer } = setup();
    const authFailure = new Error('Authentication unavailable');
    vi.mocked(keeperSession.requireAuthenticatedKeeper).mockRejectedValue(
      authFailure,
    );

    await expect(record.execute('temperature', 23.5, measuredAt)).rejects.toBe(
      authFailure,
    );
    expect(writer.record).not.toHaveBeenCalled();

    vi.mocked(keeperSession.requireAuthenticatedKeeper).mockResolvedValue({
      id: 'keeper-a',
    });
    const infrastructureFailure = new Error('Firestore unavailable');
    vi.mocked(writer.record).mockRejectedValue(infrastructureFailure);

    await expect(record.execute('temperature', 23.5, measuredAt)).rejects.toBe(
      infrastructureFailure,
    );
  });
});
