import { describe, expect, it, vi } from 'vitest';
import {
  aquariumIdFrom,
  aquariumTimeZoneFrom,
} from '../../shared/domain/aquarium-reference';
import { RecurringCarePlanWriter } from './ports';
import { ActiveAquariumContext } from '../../shared/application/active-aquarium-context';
import { ActiveAquariumContextStorage } from '../../shared/application/active-aquarium-context-storage';
import { EstablishWeeklyRecurringCare } from './establish-weekly-recurring-care';

const aquariumId = aquariumIdFrom('123e4567-e89b-42d3-a456-426614174000');

function context() {
  return new ActiveAquariumContext({
    load: vi.fn(),
    save: vi.fn(),
    clear: vi.fn(),
  } satisfies ActiveAquariumContextStorage);
}

describe('EstablishWeeklyRecurringCare', () => {
  it('requires Active Context before establishing a plan', async () => {
    const writer: RecurringCarePlanWriter = { establish: vi.fn() };
    await expect(
      new EstablishWeeklyRecurringCare(
        writer,
        {
          requireAuthenticatedKeeper: vi
            .fn()
            .mockResolvedValue({ id: 'keeper-1' }),
        },
        context(),
      ).execute(
        'Cambio semanal',
        '2026-08-16T10:00',
        aquariumTimeZoneFrom('Atlantic/Canary'),
      ),
    ).rejects.toThrow('Aquarium context is required');
    expect(writer.establish).not.toHaveBeenCalled();
  });

  it('resolves the local anchor and delegates a single recurring plan', async () => {
    const writer: RecurringCarePlanWriter = {
      establish: vi.fn().mockResolvedValue({}),
    };
    const activeContext = context();
    activeContext.select(aquariumId);
    const zone = aquariumTimeZoneFrom('Atlantic/Canary');

    await new EstablishWeeklyRecurringCare(
      writer,
      {
        requireAuthenticatedKeeper: vi
          .fn()
          .mockResolvedValue({ id: 'keeper-1' }),
      },
      activeContext,
    ).execute('Cambio semanal', '2026-08-16T10:00', zone);

    expect(writer.establish).toHaveBeenCalledWith(
      expect.objectContaining({
        id: expect.any(String),
        occurrenceId: expect.any(String),
        aquariumId,
        ownerKeeperId: 'keeper-1',
        description: 'Cambio semanal',
        timeZone: zone,
      }),
    );
  });
});
