import { CareWork } from '../domain/care-work';
import { PlannedCareWorkId } from '../domain/planned-care-work';
import { ActiveAquariumContext } from '../../shared/application/active-aquarium-context';
import { KeeperSession, PlannedCareWorkCompleter } from './ports';

export class CompletePlannedCareWork {
  constructor(
    private readonly completer: PlannedCareWorkCompleter,
    private readonly keeperSession: KeeperSession,
    private readonly activeContext: ActiveAquariumContext,
  ) {}

  async execute(plannedCareWorkId: PlannedCareWorkId): Promise<CareWork> {
    const keeper = await this.keeperSession.requireAuthenticatedKeeper();
    const aquariumId = this.activeContext.get();

    if (!aquariumId) {
      throw new Error('Aquarium context is required');
    }

    return this.completer.complete({
      id: plannedCareWorkId,
      aquariumId,
      ownerKeeperId: keeper.id,
      completedAt: new Date(),
    });
  }
}
