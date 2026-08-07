import { AquariumId } from '../domain/aquarium-id';
import { ActiveAquariumContext } from './active-aquarium-context';
import { AquariumReader, KeeperSession } from './aquarium-ports';

export class SelectAquarium {
  constructor(
    private readonly reader: AquariumReader,
    private readonly keeperSession: KeeperSession,
    private readonly activeContext: ActiveAquariumContext,
  ) {}

  async execute(aquariumId: AquariumId): Promise<void> {
    let keeper: { readonly id: string };
    try {
      keeper = await this.keeperSession.requireAuthenticatedKeeper();
    } catch (error) {
      this.activeContext.clear();
      throw error;
    }

    if (this.activeContext.get() === aquariumId) {
      return;
    }

    const aquarium = await this.reader.getOwned(keeper.id, aquariumId);

    if (!aquarium) {
      this.activeContext.clear();
      throw new Error('Aquarium unavailable');
    }

    this.activeContext.select(aquarium.id);
  }
}
