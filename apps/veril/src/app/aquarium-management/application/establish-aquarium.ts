import { Aquarium } from '../domain/aquarium';
import { AquariumName, createAquariumId } from '../domain/aquarium';
import { AquariumRepository, KeeperSession } from './ports';

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
