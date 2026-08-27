import type { Aquarium, AquariumId, AquariumName } from '../domain/aquarium';

export interface EstablishAquariumInput {
  readonly name: AquariumName;
  readonly keeperId: string;
}

export interface AquariumEstablisher {
  establish(input: EstablishAquariumInput): Promise<Aquarium>;
}

export interface AquariumListItem {
  readonly id: AquariumId;
  readonly name: AquariumName;
}

export interface AccessibleAquariumReader {
  listAccessible(keeperId: string): Promise<readonly AquariumListItem[]>;
  getAccessible(
    keeperId: string,
    aquariumId: AquariumId,
  ): Promise<AquariumListItem | null>;
}
