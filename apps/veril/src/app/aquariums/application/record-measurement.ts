import {
  canonicalUnitFor,
  createMeasurement,
  createMeasurementId,
  Measurement,
  ParameterId,
} from '../domain/measurement';
import { ActiveAquariumContext } from './active-aquarium-context';
import { KeeperSession, MeasurementWriter } from './aquarium-ports';

export class RecordMeasurement {
  constructor(
    private readonly writer: MeasurementWriter,
    private readonly keeperSession: KeeperSession,
    private readonly activeContext: ActiveAquariumContext,
  ) {}

  async execute(
    parameterId: ParameterId,
    value: number,
    measuredAt = new Date(),
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
      recordedAt: new Date(),
      provenance: 'manual',
    });

    return this.writer.record({
      ...measurement,
      ownerKeeperId: keeper.id,
    });
  }
}
