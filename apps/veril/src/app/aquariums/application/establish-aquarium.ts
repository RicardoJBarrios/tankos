import { Aquarium } from '../domain/aquarium';
import { createAquariumId } from '../domain/aquarium-id';
import { AquariumName } from '../domain/aquarium-name';
import { AquariumRepository, KeeperSession } from './aquarium-ports';

export class EstablishAquarium {
  constructor(
    private readonly repository: AquariumRepository,
    private readonly keeperSession: KeeperSession,
  ) {}

  async execute(name: string): Promise<Aquarium> {
    const aquariumName = AquariumName.create(name);
    const keeper = await this.keeperSession.requireAuthenticatedKeeper();
    const establishedAt = new Date();

    return this.repository.establish({
      id: createAquariumId(),
      name: aquariumName,
      ownerKeeperId: keeper.id,
      establishedAt,
    });
  }
}
