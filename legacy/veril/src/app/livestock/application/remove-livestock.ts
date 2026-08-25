import { ActiveAquariumContext } from '../../shared/application/active-aquarium-context';
import { KeeperSession, LivestockWriter } from './ports';
import { LivestockId } from '../domain/livestock';
import { Clock, systemClock } from '../../shared/application/clock';

export class RemoveLivestock {
  constructor(
    private readonly writer: LivestockWriter,
    private readonly session: KeeperSession,
    private readonly context: ActiveAquariumContext,
    private readonly clock: Clock = systemClock,
  ) {}
  async execute(id: LivestockId): Promise<void> {
    const keeper = await this.session.requireAuthenticatedKeeper();
    const aquariumId = this.context.get();
    if (!aquariumId) throw new Error('Aquarium context is required');
    await this.writer.remove({
      id,
      aquariumId,
      ownerKeeperId: keeper.id,
      updatedAt: this.clock.now(),
    });
  }
}
