import {
  canonicalUnitFor,
  createMeasurement,
  createMeasurementId,
  Measurement,
  ParameterId,
} from '../domain/measurement';
import { ActiveAquariumContext } from '../../shared/application/active-aquarium-context';
import { KeeperSession, MeasurementWriter } from './ports';
import { Clock, systemClock } from '../../shared/application/clock';

export class RecordMeasurement {
  constructor(
    private readonly writer: MeasurementWriter,
    private readonly keeperSession: KeeperSession,
    private readonly activeContext: ActiveAquariumContext,
    private readonly clock: Clock = systemClock,
  ) {}

  async execute(
    parameterId: ParameterId,
    value: number,
    measuredAt = this.clock.now(),
  ): Promise<Measurement> {
    const keeper = await this.keeperSession.requireAuthenticatedKeeper();
    const aquariumId = this.activeContext.get();

    if (!aquariumId) {
      throw new Error('Aquarium context is required');
    }

    const unit = canonicalUnitFor(parameterId);
    const measurement = createMeasurement({
      id: createMeasurementId(),
      aquariumId,
      parameterId,
      enteredValue: value,
      enteredUnit: unit,
      canonicalValue: value,
      canonicalUnit: unit,
      measuredAt,
      recordedAt: this.clock.now(),
      provenance: 'manual',
    });

    return this.writer.record({
      ...measurement,
      ownerKeeperId: keeper.id,
    });
  }
}
