import { describe, expect, it, vi } from 'vitest';
import { aquariumIdFrom } from '../domain/aquarium';
import { ActiveAquariumContext } from './active-aquarium-context';
import { ActiveAquariumContextStorage } from './active-aquarium-context-storage';
import { RecurringCarePlanStopper } from './aquarium-ports';
import { StopRecurringCarePlan } from './stop-recurring-care-plan';

const aquariumId = aquariumIdFrom('123e4567-e89b-42d3-a456-426614174000');
const planId = '123e4567-e89b-42d3-a456-426614174001' as never;

describe('StopRecurringCarePlan', () => {
  it('requires Active Context and delegates the owner-scoped stop', async () => {
    const stopper: RecurringCarePlanStopper = { stop: vi.fn() };
    const context = new ActiveAquariumContext({
      load: vi.fn(),
      save: vi.fn(),
      clear: vi.fn(),
    } satisfies ActiveAquariumContextStorage);
    context.select(aquariumId);

    await new StopRecurringCarePlan(
      stopper,
      {
        requireAuthenticatedKeeper: vi
          .fn()
          .mockResolvedValue({ id: 'keeper-1' }),
      },
      context,
    ).execute(planId);

    expect(stopper.stop).toHaveBeenCalledWith({
      id: planId,
      aquariumId,
      ownerKeeperId: 'keeper-1',
    });
  });
});
