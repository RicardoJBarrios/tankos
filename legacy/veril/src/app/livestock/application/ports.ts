import { AquariumId } from '../../shared/domain/aquarium-reference';
import { Page } from '../../shared/application/pagination';
import {
  Livestock,
  LivestockCategory,
  LivestockId,
  LivestockRepresentation,
} from '../domain/livestock';
export type { KeeperSession } from '../../shared/application/keeper-session';

export type SpeciesProfileId = string;

export interface SpeciesProfileOption {
  readonly id: SpeciesProfileId;
  readonly displayName: string;
  readonly scientificName?: string;
}

export interface SpeciesProfileCatalog {
  listPublished(): Promise<readonly SpeciesProfileOption[]>;
}

export interface AquariumOption {
  readonly id: AquariumId;
  readonly displayName: string;
}

export interface AquariumCatalog {
  listOwned(ownerKeeperId: string): Promise<readonly AquariumOption[]>;
}

export interface CreateLivestockInput {
  readonly id: LivestockId;
  readonly aquariumId: AquariumId;
  readonly ownerKeeperId: string;
  readonly speciesProfileId: SpeciesProfileId;
  readonly category: LivestockCategory;
  readonly representation: LivestockRepresentation;
  readonly displayName: string;
  readonly associationHistory: Livestock['associationHistory'];
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

export type LivestockListItem = Livestock;

export type LivestockCursor = string & {
  readonly __livestockCursor: unique symbol;
};

export type LivestockPage = Page<LivestockListItem, LivestockCursor>;

export interface LivestockReader {
  listActiveOwned(
    ownerKeeperId: string,
    aquariumId: AquariumId,
    cursor?: LivestockCursor,
    pageSize?: number,
  ): Promise<LivestockPage>;
  getOwned(
    ownerKeeperId: string,
    id: LivestockId,
  ): Promise<LivestockListItem | null>;
  listAllOwned(ownerKeeperId: string): Promise<readonly LivestockListItem[]>;
}

export interface LivestockAquariumReader {
  owns(ownerKeeperId: string, aquariumId: AquariumId): Promise<boolean>;
}
