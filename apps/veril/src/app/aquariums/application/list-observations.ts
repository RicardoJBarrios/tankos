import { ActiveAquariumContext } from './active-aquarium-context';
import {
  KeeperSession,
  ObservationListItem,
  ObservationReader,
} from './aquarium-ports';

export class ListObservations {
  constructor(
    private readonly reader: ObservationReader,
    private readonly keeperSession: KeeperSession,
    private readonly activeContext: ActiveAquariumContext,
  ) {}

  async execute(): Promise<readonly ObservationListItem[]> {
    const keeper = await this.keeperSession.requireAuthenticatedKeeper();
    const aquariumId = this.activeContext.get();

    if (!aquariumId) {
      throw new Error('Aquarium context is required');
    }

    return this.reader.listOwned(keeper.id, aquariumId);
  }
}
