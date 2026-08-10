import {
  createPlannedCareWork,
  createPlannedCareWorkId,
  PlannedCareWork,
} from '../domain/planned-care-work';
import { ActiveAquariumContext } from './active-aquarium-context';
import { KeeperSession, PlannedCareWorkWriter } from './aquarium-ports';

export class PlanCareWork {
  constructor(
    private readonly writer: PlannedCareWorkWriter,
    private readonly keeperSession: KeeperSession,
    private readonly activeContext: ActiveAquariumContext,
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
      recordedAt: new Date(),
      provenance: 'manual',
    });

    return this.writer.recordPlanned({
      ...plannedCareWork,
      ownerKeeperId: keeper.id,
      provenance: 'manual',
    });
  }
}
