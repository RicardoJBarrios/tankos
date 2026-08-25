import { ActiveAquariumContext } from '../../shared/application/active-aquarium-context';
import { KeeperSession, LivestockWriter } from './ports';
import { createLivestock, createLivestockId } from '../domain/livestock';
import { SpeciesProfileId } from './ports';
import { Clock, systemClock } from '../../shared/application/clock';

export class AddLivestock {
  constructor(
    private readonly writer: LivestockWriter,
    private readonly session: KeeperSession,
    private readonly context: ActiveAquariumContext,
    private readonly clock: Clock = systemClock,
  ) {}

  async execute(input: {
    readonly speciesProfileId: SpeciesProfileId;
    readonly category: 'fish' | 'coral' | 'other';
    readonly representation: 'individual' | 'group';
    readonly displayName: string;
  }): Promise<void> {
    const keeper = await this.session.requireAuthenticatedKeeper();
    const aquariumId = this.context.get();
    if (!aquariumId) throw new Error('Aquarium context is required');
    const now = this.clock.now();
    const livestock = createLivestock({
      id: createLivestockId(),
      aquariumId,
      ...input,
      associatedAt: now,
      updatedAt: now,
      associationHistory: [{ aquariumId, associatedAt: now }],
    });
    await this.writer.create({ ...livestock, ownerKeeperId: keeper.id });
  }
}
