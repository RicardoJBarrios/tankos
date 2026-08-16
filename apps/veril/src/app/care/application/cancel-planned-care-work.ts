import { PlannedCareWorkId } from '../domain/planned-care-work';
import { ActiveAquariumContext } from '../../shared/application/active-aquarium-context';
import { KeeperSession, PlannedCareWorkCanceller } from './ports';

export class CancelPlannedCareWork {
  constructor(
    private readonly canceller: PlannedCareWorkCanceller,
    private readonly keeperSession: KeeperSession,
    private readonly activeContext: ActiveAquariumContext,
  ) {}

  async execute(plannedCareWorkId: PlannedCareWorkId): Promise<void> {
    const keeper = await this.keeperSession.requireAuthenticatedKeeper();
    const aquariumId = this.activeContext.get();

    if (!aquariumId) {
      throw new Error('Aquarium context is required');
    }

    await this.canceller.cancel({
      id: plannedCareWorkId,
      aquariumId,
      ownerKeeperId: keeper.id,
      actionAt: new Date(),
    });
  }
}
