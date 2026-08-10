import { AquariumTimeZone, aquariumTimeZoneFrom } from '../domain/aquarium';
import { AquariumTimeZoneConfigurer, KeeperSession } from './aquarium-ports';
import { ActiveAquariumContext } from './active-aquarium-context';

export class ConfigureAquariumTimeZone {
  constructor(
    private readonly configurer: AquariumTimeZoneConfigurer,
    private readonly keeperSession: KeeperSession,
    private readonly activeContext: ActiveAquariumContext,
  ) {}

  async execute(value: string): Promise<AquariumTimeZone> {
    const timeZone = aquariumTimeZoneFrom(value);
    const keeper = await this.keeperSession.requireAuthenticatedKeeper();
    const aquariumId = this.activeContext.get();
    if (!aquariumId) {
      throw new Error('No active Aquarium');
    }

    return this.configurer.configure({
      aquariumId,
      ownerKeeperId: keeper.id,
      timeZone,
    });
  }
}
