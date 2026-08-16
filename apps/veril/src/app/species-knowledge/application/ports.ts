import {
  SpeciesProfile,
  SpeciesProfileId,
  SpeciesProfileReference,
} from '../domain/species-profile';

export type { SpeciesProfile } from '../domain/species-profile';

export interface PublishedSpeciesProfileReader {
  listPublished(): Promise<readonly SpeciesProfileReference[]>;
  getPublished(id: SpeciesProfileId): Promise<SpeciesProfile | null>;
}
