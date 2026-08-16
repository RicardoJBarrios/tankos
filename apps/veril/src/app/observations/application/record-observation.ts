import {
  createObservation,
  createObservationId,
  Observation,
} from '../domain/observation';
import { ActiveAquariumContext } from '../../shared/application/active-aquarium-context';
import { KeeperSession, ObservationWriter } from './ports';

export class RecordObservation {
  constructor(
    private readonly writer: ObservationWriter,
    private readonly keeperSession: KeeperSession,
    private readonly activeContext: ActiveAquariumContext,
  ) {}

  async execute(content: string): Promise<Observation> {
    const keeper = await this.keeperSession.requireAuthenticatedKeeper();
    const aquariumId = this.activeContext.get();

    if (!aquariumId) {
      throw new Error('Aquarium context is required');
    }

    const observation = createObservation({
      id: createObservationId(),
      aquariumId,
      content,
      recordedAt: new Date(),
    });

    return this.writer.record({
      ...observation,
      ownerKeeperId: keeper.id,
    });
  }
}
