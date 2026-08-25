import { speciesProfileIdFrom } from '../domain/species-profile';
import { PublishedSpeciesProfileReader } from './ports';

export class GetPublishedSpeciesProfile {
  constructor(private readonly reader: PublishedSpeciesProfileReader) {}

  execute(id: string) {
    return this.reader.getPublished(speciesProfileIdFrom(id));
  }
}
