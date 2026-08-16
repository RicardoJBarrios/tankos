import { ActiveAquariumContext } from '../../shared/application/active-aquarium-context';
import { CareWorkListItem, CareWorkReader, KeeperSession } from './ports';

export const CARE_WORK_HISTORY_LIMIT = 50;

export class ListCareWork {
  constructor(
    private readonly reader: CareWorkReader,
    private readonly keeperSession: KeeperSession,
    private readonly activeContext: ActiveAquariumContext,
  ) {}

  async execute(): Promise<readonly CareWorkListItem[]> {
    const keeper = await this.keeperSession.requireAuthenticatedKeeper();
    const aquariumId = this.activeContext.get();

    if (!aquariumId) {
      throw new Error('Aquarium context is required');
    }

    return this.reader.listRecentOwned(
      keeper.id,
      aquariumId,
      CARE_WORK_HISTORY_LIMIT,
    );
  }
}
