import { ActiveAquariumContext } from '../../shared/application/active-aquarium-context';
import {
  KeeperSession,
  MeasurementCursor,
  MeasurementPage,
  MeasurementReader,
} from './ports';

export class ListMeasurements {
  constructor(
    private readonly reader: MeasurementReader,
    private readonly keeperSession: KeeperSession,
    private readonly activeContext: ActiveAquariumContext,
  ) {}

  async execute(
    cursor?: MeasurementCursor,
    pageSize?: number,
  ): Promise<MeasurementPage> {
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
