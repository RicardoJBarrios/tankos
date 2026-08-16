import { Provider } from '@angular/core';
import { FirestoreSpeciesProfileDraftWriter } from '../../species-knowledge/infrastructure/firestore-species-profile-draft-writer';
import { SPECIES_PROFILE_DRAFT_WRITER } from '../../species-knowledge/ui/providers';

export const EDITORIAL_PROVIDERS: Provider[] = [
  {
    provide: SPECIES_PROFILE_DRAFT_WRITER,
    useClass: FirestoreSpeciesProfileDraftWriter,
  },
];
