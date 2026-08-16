import { SpeciesProfileReference } from '../domain/species-profile';

export interface PublishedSpeciesProfileReader {
  listPublished(): Promise<readonly SpeciesProfileReference[]>;
}
