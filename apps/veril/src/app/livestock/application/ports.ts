import { AquariumId } from '../../shared/domain/aquarium-reference';
import {
  Livestock,
  LivestockCategory,
  LivestockId,
  LivestockRepresentation,
  SpeciesProfileId,
} from '../domain/livestock';
export type { KeeperSession } from '../../shared/application/keeper-session';

export interface SpeciesProfileReference {
  readonly id: SpeciesProfileId;
  readonly displayName: string;
  readonly scientificName?: string;
  readonly status: 'published' | 'retired';
}

export interface SpeciesProfileReader {
  getPublished(id: SpeciesProfileId): Promise<SpeciesProfileReference | null>;
}

export interface CreateLivestockInput {
  readonly id: LivestockId;
  readonly aquariumId: AquariumId;
  readonly ownerKeeperId: string;
  readonly speciesProfileId: SpeciesProfileId;
  readonly category: LivestockCategory;
  readonly representation: LivestockRepresentation;
  readonly displayName: string;
  readonly associatedAt: Date;
  readonly updatedAt: Date;
}

export interface LivestockWriter {
  create(input: CreateLivestockInput): Promise<Livestock>;
  transfer(input: {
    readonly id: LivestockId;
    readonly fromAquariumId: AquariumId;
    readonly toAquariumId: AquariumId;
    readonly ownerKeeperId: string;
    readonly updatedAt: Date;
  }): Promise<Livestock>;
  remove(input: {
    readonly id: LivestockId;
    readonly aquariumId: AquariumId;
    readonly ownerKeeperId: string;
    readonly updatedAt: Date;
  }): Promise<void>;
}

export interface LivestockListItem extends Livestock {
  readonly speciesProfile: SpeciesProfileReference;
}

export interface LivestockReader {
  listActiveOwned(
    ownerKeeperId: string,
    aquariumId: AquariumId,
  ): Promise<readonly LivestockListItem[]>;
  getOwned(
    ownerKeeperId: string,
    id: LivestockId,
  ): Promise<LivestockListItem | null>;
}
