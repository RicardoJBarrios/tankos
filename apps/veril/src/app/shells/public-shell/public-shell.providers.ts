import { Provider } from '@angular/core';
import { FirestoreSpeciesProfileReader } from '../../species-knowledge/infrastructure/firestore-species-profile-reader';
import { PUBLISHED_SPECIES_PROFILE_READER } from '../../species-knowledge/ui/providers';

export const PUBLIC_SHELL_PROVIDERS: Provider[] = [
  {
    provide: PUBLISHED_SPECIES_PROFILE_READER,
    useClass: FirestoreSpeciesProfileReader,
  },
];
