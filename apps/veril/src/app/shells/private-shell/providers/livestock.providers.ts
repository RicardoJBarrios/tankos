import { inject, Provider } from '@angular/core';
import { AquariumReader } from '../../../aquarium-management/application/ports';
import { AQUARIUM_REPOSITORY } from '../../../aquarium-management/ui/providers';
import {
  LivestockAquariumCatalog,
  LivestockSpeciesProfileCatalog,
} from '../../../composition/livestock/livestock-catalogs';
import { FirestoreLivestockRepository } from '../../../livestock/infrastructure/firestore-livestock-repository';
import { FirestoreSpeciesProfileReader } from '../../../species-knowledge/infrastructure/firestore-species-profile-reader';
import { PUBLISHED_SPECIES_PROFILE_READER } from '../../../species-knowledge/ui/providers';
import {
  LIVESTOCK_AQUARIUM_CATALOG,
  LIVESTOCK_READER,
  LIVESTOCK_SPECIES_PROFILE_CATALOG,
  LIVESTOCK_WRITER,
} from '../../../livestock/ui/providers';

export const PRIVATE_LIVESTOCK_PROVIDERS: Provider[] = [
  { provide: LIVESTOCK_READER, useClass: FirestoreLivestockRepository },
  { provide: LIVESTOCK_WRITER, useClass: FirestoreLivestockRepository },
  {
    provide: FirestoreSpeciesProfileReader,
    useClass: FirestoreSpeciesProfileReader,
  },
  {
    provide: PUBLISHED_SPECIES_PROFILE_READER,
    useExisting: FirestoreSpeciesProfileReader,
  },
  {
    provide: LIVESTOCK_AQUARIUM_CATALOG,
    useFactory: () =>
      new LivestockAquariumCatalog(
        inject(AQUARIUM_REPOSITORY) as AquariumReader,
      ),
  },
  {
    provide: LIVESTOCK_SPECIES_PROFILE_CATALOG,
    useFactory: () =>
      new LivestockSpeciesProfileCatalog(inject(FirestoreSpeciesProfileReader)),
  },
];
