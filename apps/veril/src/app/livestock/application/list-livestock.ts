import { ActiveAquariumContext } from '../../shared/application/active-aquarium-context';
import { KeeperSession, LivestockListItem, LivestockReader } from './ports';

export class ListLivestock {
  constructor(
    private readonly reader: LivestockReader,
    private readonly session: KeeperSession,
    private readonly context: ActiveAquariumContext,
  ) {}
  async execute(): Promise<readonly LivestockListItem[]> {
    const keeper = await this.session.requireAuthenticatedKeeper();
    const aquariumId = this.context.get();
    if (!aquariumId) throw new Error('Aquarium context is required');
    return this.reader.listActiveOwned(keeper.id, aquariumId);
  }
}
