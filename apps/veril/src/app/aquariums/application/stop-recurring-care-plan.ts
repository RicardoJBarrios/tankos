import { RecurringCarePlanId } from '../domain/recurring-care-plan';
import { ActiveAquariumContext } from './active-aquarium-context';
import { KeeperSession, RecurringCarePlanStopper } from './aquarium-ports';

export class StopRecurringCarePlan {
  constructor(
    private readonly stopper: RecurringCarePlanStopper,
    private readonly keeperSession: KeeperSession,
    private readonly activeContext: ActiveAquariumContext,
  ) {}

  async execute(id: RecurringCarePlanId): Promise<void> {
    const keeper = await this.keeperSession.requireAuthenticatedKeeper();
    const aquariumId = this.activeContext.get();
    if (!aquariumId) throw new Error('Aquarium context is required');

    await this.stopper.stop({
      id,
      aquariumId,
      ownerKeeperId: keeper.id,
    });
  }
}
