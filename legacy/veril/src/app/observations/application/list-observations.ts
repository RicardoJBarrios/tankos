import { ActiveAquariumContext } from '../../shared/application/active-aquarium-context';
import {
  KeeperSession,
  ObservationCursor,
  ObservationPage,
  ObservationReader,
} from './ports';

export class ListObservations {
  constructor(
    private readonly reader: ObservationReader,
    private readonly keeperSession: KeeperSession,
    private readonly activeContext: ActiveAquariumContext,
  ) {}

  async execute(
    cursor?: ObservationCursor,
    pageSize?: number,
  ): Promise<ObservationPage> {
    const keeper = await this.keeperSession.requireAuthenticatedKeeper();
    const aquariumId = this.activeContext.get();

    if (!aquariumId) {
      throw new Error('Aquarium context is required');
    }

    return pageSize === undefined
      ? this.reader.listOwned(keeper.id, aquariumId, cursor)
      : this.reader.listOwned(keeper.id, aquariumId, cursor, pageSize);
  }
}
