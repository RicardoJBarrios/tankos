import { ActiveAquariumContext } from '../../shared/application/active-aquarium-context';
import { KeeperSession, LivestockWriter } from './ports';
import { AquariumId } from '../../shared/domain/aquarium-reference';
import { LivestockId } from '../domain/livestock';
import { Clock, systemClock } from '../../shared/application/clock';

export class TransferLivestock {
  constructor(
    private readonly writer: LivestockWriter,
    private readonly session: KeeperSession,
    private readonly context: ActiveAquariumContext,
    private readonly clock: Clock = systemClock,
  ) {}
  async execute(id: LivestockId, toAquariumId: AquariumId): Promise<void> {
    const keeper = await this.session.requireAuthenticatedKeeper();
    const fromAquariumId = this.context.get();
    if (!fromAquariumId) throw new Error('Aquarium context is required');
    await this.writer.transfer({
      id,
      fromAquariumId,
      toAquariumId,
      ownerKeeperId: keeper.id,
      updatedAt: this.clock.now(),
    });
  }
}
