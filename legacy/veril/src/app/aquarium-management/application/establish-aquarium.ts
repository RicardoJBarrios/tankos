import { Aquarium } from '../domain/aquarium';
import { AquariumName, createAquariumId } from '../domain/aquarium';
import { AquariumRepository, KeeperSession } from './ports';
import { Clock, systemClock } from '../../shared/application/clock';

export class EstablishAquarium {
  constructor(
    private readonly repository: AquariumRepository,
    private readonly keeperSession: KeeperSession,
    private readonly clock: Clock = systemClock,
  ) {}

  async execute(name: string): Promise<Aquarium> {
    const aquariumName = AquariumName.create(name);
    const keeper = await this.keeperSession.requireAuthenticatedKeeper();
    const establishedAt = this.clock.now();

    return this.repository.establish({
      id: createAquariumId(),
      name: aquariumName,
      ownerKeeperId: keeper.id,
      establishedAt,
    });
  }
}
