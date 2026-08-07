import { AquariumId } from './aquarium-id';
import { AquariumName } from './aquarium-name';

export interface Aquarium {
  readonly id: AquariumId;
  readonly name: AquariumName;
  readonly ownerKeeperId: string;
  readonly establishedAt: Date;
}
