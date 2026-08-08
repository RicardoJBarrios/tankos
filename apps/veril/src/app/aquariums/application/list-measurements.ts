import { ActiveAquariumContext } from './active-aquarium-context';
import {
  KeeperSession,
  MeasurementCursor,
  MeasurementPage,
  MeasurementReader,
} from './aquarium-ports';

export class ListMeasurements {
  constructor(
    private readonly reader: MeasurementReader,
    private readonly keeperSession: KeeperSession,
    private readonly activeContext: ActiveAquariumContext,
  ) {}

  async execute(cursor?: MeasurementCursor): Promise<MeasurementPage> {
    const keeper = await this.keeperSession.requireAuthenticatedKeeper();
    const aquariumId = this.activeContext.get();

    if (!aquariumId) {
      throw new Error('Aquarium context is required');
    }

    return this.reader.listOwned(keeper.id, aquariumId, cursor);
  }
}
