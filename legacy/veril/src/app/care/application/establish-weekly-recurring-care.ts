import {
  AquariumTimeZone,
  aquariumTimeZoneFrom,
} from '../../shared/domain/aquarium-reference';
import { createPlannedCareWorkId } from '../domain/planned-care-work';
import {
  createRecurringCarePlan,
  createRecurringCarePlanId,
  resolveLocalDateTime,
} from '../domain/recurring-care-plan';
import { ActiveAquariumContext } from '../../shared/application/active-aquarium-context';
import { KeeperSession, RecurringCarePlanWriter } from './ports';
import { Clock, systemClock } from '../../shared/application/clock';

export class EstablishWeeklyRecurringCare {
  constructor(
    private readonly writer: RecurringCarePlanWriter,
    private readonly keeperSession: KeeperSession,
    private readonly activeContext: ActiveAquariumContext,
    private readonly clock: Clock = systemClock,
  ) {}

  async execute(
    description: string,
    firstOccurrenceLocal: string,
    timeZone: AquariumTimeZone,
  ) {
    const keeper = await this.keeperSession.requireAuthenticatedKeeper();
    const aquariumId = this.activeContext.get();
    if (!aquariumId) throw new Error('Aquarium context is required');

    const zone = aquariumTimeZoneFrom(timeZone);
    const firstOccurrenceAt = resolveLocalDateTime(firstOccurrenceLocal, zone);
    const plan = createRecurringCarePlan({
      id: createRecurringCarePlanId(),
      aquariumId,
      description,
      firstOccurrenceAt,
      recordedAt: this.clock.now(),
      outstandingPlannedCareWorkId: createPlannedCareWorkId(),
      timeZone: zone,
    });

    return this.writer.establish({
      id: plan.id,
      occurrenceId: plan.outstandingPlannedCareWorkId,
      aquariumId,
      ownerKeeperId: keeper.id,
      description: plan.description,
      firstOccurrenceAt: plan.firstOccurrenceAt,
      recordedAt: plan.recordedAt,
      timeZone: zone,
    });
  }
}
