import {
  AquariumLocation,
  AquariumName,
} from '../../shared/domain/aquarium-reference';
import type {
  AquariumId,
  AquariumTimeZone,
  ParameterTargets,
} from '../../shared/domain/aquarium-reference';

export {
  AquariumLocation,
  AquariumName,
  ParameterTarget,
  aquariumIdFrom,
  aquariumTimeZoneFrom,
  createAquariumId,
  parameterTargetsFrom,
} from '../../shared/domain/aquarium-reference';
export type {
  AquariumId,
  AquariumTimeZone,
  ParameterTargets,
} from '../../shared/domain/aquarium-reference';

export interface Aquarium {
  readonly id: AquariumId;
  readonly name: AquariumName;
  readonly ownerKeeperId: string;
  readonly establishedAt: Date;
  readonly timeZone?: AquariumTimeZone;
  readonly location?: AquariumLocation;
  readonly parameterTargets?: ParameterTargets;
}
