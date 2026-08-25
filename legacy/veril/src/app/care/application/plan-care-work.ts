import {
  createPlannedCareWork,
  createPlannedCareWorkId,
  PlannedCareWork,
} from '../domain/planned-care-work';
import { ActiveAquariumContext } from '../../shared/application/active-aquarium-context';
import { KeeperSession, PlannedCareWorkWriter } from './ports';
import { Clock, systemClock } from '../../shared/application/clock';

export class PlanCareWork {
  constructor(
    private readonly writer: PlannedCareWorkWriter,
    private readonly keeperSession: KeeperSession,
    private readonly activeContext: ActiveAquariumContext,
    private readonly clock: Clock = systemClock,
  ) {}

  async execute(
    description: string,
    plannedFor: Date,
  ): Promise<PlannedCareWork> {
    const keeper = await this.keeperSession.requireAuthenticatedKeeper();
    const aquariumId = this.activeContext.get();

    if (!aquariumId) {
      throw new Error('Aquarium context is required');
    }

    const plannedCareWork = createPlannedCareWork({
      id: createPlannedCareWorkId(),
      aquariumId,
      description,
      plannedFor,
      recordedAt: this.clock.now(),
      provenance: 'manual',
    });

    return this.writer.recordPlanned({
      ...plannedCareWork,
      ownerKeeperId: keeper.id,
      provenance: 'manual',
    });
  }
}
