import { describe, expect, it, vi } from 'vitest';
import { aquariumIdFrom } from '../domain/aquarium';
import { ActiveAquariumContext } from './active-aquarium-context';
import { ActiveAquariumContextStorage } from './active-aquarium-context-storage';
import { PlanCareWork } from './plan-care-work';
import { PlannedCareWorkWriter, KeeperSession } from './aquarium-ports';

const aquariumId = aquariumIdFrom('123e4567-e89b-42d3-a456-426614174000');
const plannedFor = new Date('2026-08-10T10:00:00.000Z');

function setup() {
  const writer: PlannedCareWorkWriter = { recordPlanned: vi.fn() };
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
    plan: new PlanCareWork(writer, keeperSession, context),
  };
}

describe('PlanCareWork', () => {
  it('records a planned intention in the active Aquarium', async () => {
    const { plan, writer } = setup();
    vi.mocked(writer.recordPlanned).mockImplementation(async (input) => input);

    const result = await plan.execute('  Limpiar el skimmer  ', plannedFor);

    expect(writer.recordPlanned).toHaveBeenCalledWith(
      expect.objectContaining({
        aquariumId,
        ownerKeeperId: 'keeper-a',
        description: 'Limpiar el skimmer',
        plannedFor,
        provenance: 'manual',
        recordedAt: expect.any(Date),
      }),
    );
    expect(result.description).toBe('Limpiar el skimmer');
  });

  it('does not write without Active Context', async () => {
    const { plan, context, writer } = setup();
    context.clear();

    await expect(
      plan.execute('Limpiar el skimmer', plannedFor),
    ).rejects.toThrow('Aquarium context is required');
    expect(writer.recordPlanned).not.toHaveBeenCalled();
  });

  it('requires authentication and propagates persistence failures', async () => {
    const { plan, keeperSession, writer } = setup();
    const authenticationError = new Error('unauthenticated');
    vi.mocked(keeperSession.requireAuthenticatedKeeper).mockRejectedValue(
      authenticationError,
    );
    await expect(plan.execute('Limpieza', plannedFor)).rejects.toBe(
      authenticationError,
    );

    vi.mocked(keeperSession.requireAuthenticatedKeeper).mockResolvedValue({
      id: 'keeper-a',
    });
    const persistenceError = new Error('offline');
    vi.mocked(writer.recordPlanned).mockRejectedValue(persistenceError);
    await expect(plan.execute('Limpieza', plannedFor)).rejects.toBe(
      persistenceError,
    );
  });
});
