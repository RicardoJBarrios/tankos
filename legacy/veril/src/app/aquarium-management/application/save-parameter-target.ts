import { ParameterTarget } from '../../shared/domain/aquarium-reference';
import { ParameterId } from '../../shared/domain/parameter-reference';
import { ActiveAquariumContext } from '../../shared/application/active-aquarium-context';
import { KeeperSession, ParameterTargetWriter } from './ports';

export class SaveParameterTarget {
  constructor(
    private readonly writer: ParameterTargetWriter,
    private readonly keeperSession: KeeperSession,
    private readonly activeContext: ActiveAquariumContext,
  ) {}

  async execute(
    parameterId: ParameterId,
    minimum: number,
    maximum: number,
  ): Promise<ParameterTarget> {
    const target = ParameterTarget.create({ parameterId, minimum, maximum });
    const keeper = await this.keeperSession.requireAuthenticatedKeeper();
    const aquariumId = this.activeContext.get();
    if (!aquariumId) {
      throw new Error('No active Aquarium');
    }

    return this.writer.saveOwned({
      aquariumId,
      ownerKeeperId: keeper.id,
      target,
    });
  }
}
