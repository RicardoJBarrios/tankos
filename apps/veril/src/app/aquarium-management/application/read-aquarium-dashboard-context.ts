import {
  AquariumDashboardContext,
  AquariumDashboardReader,
  KeeperSession,
} from './ports';
import { ActiveAquariumContext } from '../../shared/application/active-aquarium-context';

export class ReadAquariumDashboardContext {
  constructor(
    private readonly reader: AquariumDashboardReader,
    private readonly keeperSession: KeeperSession,
    private readonly activeContext: ActiveAquariumContext,
  ) {}

  async execute(): Promise<AquariumDashboardContext> {
    const keeper = await this.keeperSession.requireAuthenticatedKeeper();
    const aquariumId = this.activeContext.get();
    if (!aquariumId) {
      throw new Error('No active Aquarium');
    }

    const context = await this.reader.getDashboardContextOwned(
      keeper.id,
      aquariumId,
    );
    if (!context) {
      throw new Error('Aquarium not found');
    }

    return context;
  }
}
