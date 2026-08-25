import { aquariumIdFrom } from '../domain/aquarium';
import { ActiveAquariumContext } from '../../shared/application/active-aquarium-context';
import { ActiveAquariumContextStorage } from '../../shared/application/active-aquarium-context-storage';
import { AquariumReader, KeeperSession } from './ports';

/** Restores only a still-owned Aquarium from an untrusted browser hint. */
export class RestoreActiveAquarium {
  constructor(
    private readonly reader: AquariumReader,
    private readonly keeperSession: KeeperSession,
    private readonly activeContext: ActiveAquariumContext,
    private readonly storage: ActiveAquariumContextStorage,
  ) {}

  async execute(): Promise<void> {
    const storedId = this.storage.load();

    if (!storedId) {
      return;
    }

    try {
      const aquariumId = aquariumIdFrom(storedId);
      const keeper = await this.keeperSession.requireAuthenticatedKeeper();
      const aquarium = await this.reader.getOwned(keeper.id, aquariumId);

      if (!aquarium) {
        this.activeContext.clear();
        return;
      }

      this.activeContext.select(aquarium.id);
    } catch {
      this.activeContext.clear();
    }
  }
}
