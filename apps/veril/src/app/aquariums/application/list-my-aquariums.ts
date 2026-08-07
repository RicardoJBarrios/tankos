import { AquariumReader, KeeperSession } from './aquarium-ports';
import { AquariumListItem } from './aquarium-ports';

export class ListMyAquariums {
  constructor(
    private readonly reader: AquariumReader,
    private readonly keeperSession: KeeperSession,
  ) {}

  async execute(): Promise<readonly AquariumListItem[]> {
    const keeper = await this.keeperSession.requireAuthenticatedKeeper();

    return this.reader.listOwned(keeper.id);
  }
}
