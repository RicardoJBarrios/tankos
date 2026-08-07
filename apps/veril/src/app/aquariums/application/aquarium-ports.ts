import { Aquarium } from '../domain/aquarium';
import { AquariumId } from '../domain/aquarium-id';
import { AquariumName } from '../domain/aquarium-name';

export interface KeeperSession {
  requireAuthenticatedKeeper(): Promise<{ readonly id: string }>;
}

export interface EstablishAquariumInput {
  readonly id: AquariumId;
  readonly name: AquariumName;
  readonly ownerKeeperId: string;
  readonly establishedAt: Date;
}

export interface AquariumRepository {
  establish(input: EstablishAquariumInput): Promise<Aquarium>;
}
