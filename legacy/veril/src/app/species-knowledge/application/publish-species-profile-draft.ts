import { Clock, systemClock } from '../../shared/application/clock';
import { createUuidV4 } from '../../shared/domain/uuid-v4';
import { SpeciesProfileDraft } from '../domain/species-profile';
import { SpeciesProfilePublisher } from './ports';

export class PublishSpeciesProfileDraft {
  constructor(
    private readonly publisher: SpeciesProfilePublisher,
    private readonly clock: Clock = systemClock,
    private readonly createRevisionId: () => string = createUuidV4,
  ) {}

  async execute(draft: SpeciesProfileDraft): Promise<void> {
    await this.publisher.publishDraft(
      draft,
      this.createRevisionId(),
      this.clock.now(),
    );
  }
}
