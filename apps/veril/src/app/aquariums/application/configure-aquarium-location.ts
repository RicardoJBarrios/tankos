import { AquariumLocation } from '../domain/aquarium';
import { AquariumLocationConfigurer, KeeperSession } from './aquarium-ports';
import { ActiveAquariumContext } from './active-aquarium-context';

export class ConfigureAquariumLocation {
  constructor(
    private readonly configurer: AquariumLocationConfigurer,
    private readonly keeperSession: KeeperSession,
    private readonly activeContext: ActiveAquariumContext,
  ) {}

  async execute(location: AquariumLocation): Promise<AquariumLocation> {
    const normalized = AquariumLocation.create(location);
    const keeper = await this.keeperSession.requireAuthenticatedKeeper();
    const aquariumId = this.activeContext.get();
    if (!aquariumId) {
      throw new Error('No active Aquarium');
    }

    return this.configurer.configureLocation({
      aquariumId,
      ownerKeeperId: keeper.id,
      location: normalized,
    });
  }
}
