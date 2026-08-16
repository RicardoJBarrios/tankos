import { ActiveAquariumContext } from '../../shared/application/active-aquarium-context';
import {
  CurrentMeasurementReader,
  CurrentMeasurementValue,
  KeeperSession,
} from './ports';
import { PARAMETER_IDS } from '../domain/measurement';

export class ReviewCurrentMeasurements {
  constructor(
    private readonly reader: CurrentMeasurementReader,
    private readonly keeperSession: KeeperSession,
    private readonly activeContext: ActiveAquariumContext,
  ) {}

  async execute(): Promise<readonly CurrentMeasurementValue[]> {
    const keeper = await this.keeperSession.requireAuthenticatedKeeper();
    const aquariumId = this.activeContext.get();

    if (!aquariumId) {
      throw new Error('Aquarium context is required');
    }

    return Promise.all(
      PARAMETER_IDS.map(async (parameterId) => {
        const measurement = await this.reader.findCurrentOwned(
          keeper.id,
          aquariumId,
          parameterId,
        );

        return measurement
          ? {
              parameterId,
              canonicalValue: measurement.canonicalValue,
              canonicalUnit: measurement.canonicalUnit,
              measuredAt: measurement.measuredAt,
            }
          : {
              parameterId,
              canonicalValue: null,
              canonicalUnit: null,
              measuredAt: null,
            };
      }),
    );
  }
}
