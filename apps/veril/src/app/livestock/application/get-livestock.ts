import { KeeperSession, LivestockReader } from './ports';

export class GetLivestock {
  constructor(
    private readonly reader: LivestockReader,
    private readonly session: KeeperSession,
  ) {}

  async execute(id: string) {
    const keeper = await this.session.requireAuthenticatedKeeper();
    const livestock = await this.reader.getOwned(keeper.id, id as never);
    if (!livestock) throw new Error('Livestock not found');
    return livestock;
  }
}
