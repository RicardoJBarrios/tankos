import { AquariumReader, KeeperSession } from './ports';
import { AquariumListItem } from './ports';

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
