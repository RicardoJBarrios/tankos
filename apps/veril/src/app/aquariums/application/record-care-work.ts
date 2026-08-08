import {
  CareWork,
  createCareWork,
  createCareWorkId,
} from '../domain/care-work';
import { ActiveAquariumContext } from './active-aquarium-context';
import { CareWorkWriter, KeeperSession } from './aquarium-ports';

export class RecordCareWork {
  constructor(
    private readonly writer: CareWorkWriter,
    private readonly keeperSession: KeeperSession,
    private readonly activeContext: ActiveAquariumContext,
  ) {}

  async execute(description: string, performedAt: Date): Promise<CareWork> {
    const keeper = await this.keeperSession.requireAuthenticatedKeeper();
    const aquariumId = this.activeContext.get();

    if (!aquariumId) {
      throw new Error('Aquarium context is required');
    }

    const careWork = createCareWork({
      id: createCareWorkId(),
      aquariumId,
      description,
      performedAt,
      recordedAt: new Date(),
      provenance: 'manual',
    });

    return this.writer.record({ ...careWork, ownerKeeperId: keeper.id });
  }
}
