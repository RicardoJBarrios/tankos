import { AquariumReader } from '../../aquarium-management/application/ports';
import { PublishedSpeciesProfileReader } from '../../species-knowledge/application/ports';
import {
  AquariumCatalog,
  SpeciesProfileCatalog,
} from '../../livestock/application/ports';

export class LivestockAquariumCatalog implements AquariumCatalog {
  constructor(private readonly reader: AquariumReader) {}

  async listOwned(ownerKeeperId: string) {
    const page = await this.reader.listOwned(ownerKeeperId);
    return page.items.map((aquarium) => ({
      id: aquarium.id,
      displayName: aquarium.name.value,
    }));
  }
}

export class LivestockSpeciesProfileCatalog implements SpeciesProfileCatalog {
  constructor(private readonly reader: PublishedSpeciesProfileReader) {}

  async listPublished() {
    return this.reader.listPublished();
  }
}
