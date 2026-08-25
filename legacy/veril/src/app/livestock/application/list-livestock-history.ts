import { KeeperSession, LivestockReader } from './ports';

export class ListLivestockHistory {
  constructor(
    private readonly reader: LivestockReader,
    private readonly session: KeeperSession,
  ) {}

  async execute() {
    const keeper = await this.session.requireAuthenticatedKeeper();
    return this.reader.listAllOwned(keeper.id);
  }
}
