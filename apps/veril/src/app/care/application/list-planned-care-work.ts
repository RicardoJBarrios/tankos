import { ActiveAquariumContext } from '../../shared/application/active-aquarium-context';
import {
  KeeperSession,
  PlannedCareWorkCursor,
  PlannedCareWorkPage,
  PlannedCareWorkReader,
} from './ports';

export const PLANNED_CARE_WORK_LIMIT = 50;

export class ListPlannedCareWork {
  constructor(
    private readonly reader: PlannedCareWorkReader,
    private readonly keeperSession: KeeperSession,
    private readonly activeContext: ActiveAquariumContext,
  ) {}

  async execute(
    cursor?: PlannedCareWorkCursor,
    pageSize?: number,
  ): Promise<PlannedCareWorkPage> {
    const keeper = await this.keeperSession.requireAuthenticatedKeeper();
    const aquariumId = this.activeContext.get();

    if (!aquariumId) {
      throw new Error('Aquarium context is required');
    }

    return this.reader.listOwned(keeper.id, aquariumId, cursor, pageSize);
  }
}
