import {
  isParameterId,
  ParameterId,
} from '../../shared/domain/parameter-reference';
import { ActiveAquariumContext } from '../../shared/application/active-aquarium-context';
import { KeeperSession, ParameterTargetWriter } from './ports';

export class RemoveParameterTarget {
  constructor(
    private readonly writer: ParameterTargetWriter,
    private readonly keeperSession: KeeperSession,
    private readonly activeContext: ActiveAquariumContext,
  ) {}

  async execute(parameterId: ParameterId): Promise<void> {
    if (!isParameterId(parameterId)) {
      throw new Error('Unsupported Parameter target');
    }

    const keeper = await this.keeperSession.requireAuthenticatedKeeper();
    const aquariumId = this.activeContext.get();
    if (!aquariumId) {
      throw new Error('No active Aquarium');
    }

    return this.writer.removeOwned({
      aquariumId,
      ownerKeeperId: keeper.id,
      parameterId,
    });
  }
}
