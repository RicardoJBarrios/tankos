import { Provider } from '@angular/core';
import { FirestoreSpeciesProfileDraftWriter } from '../../species-knowledge/infrastructure/firestore-species-profile-draft-writer';
import {
  SPECIES_PROFILE_DRAFT_READER,
  SPECIES_PROFILE_DRAFT_WRITER,
  SPECIES_PROFILE_PUBLISHER,
} from '../../species-knowledge/ui/providers';

export const EDITORIAL_PROVIDERS: Provider[] = [
  {
    provide: SPECIES_PROFILE_DRAFT_WRITER,
    useClass: FirestoreSpeciesProfileDraftWriter,
  },
  {
    provide: SPECIES_PROFILE_DRAFT_READER,
    useExisting: FirestoreSpeciesProfileDraftWriter,
  },
  {
    provide: SPECIES_PROFILE_PUBLISHER,
    useExisting: FirestoreSpeciesProfileDraftWriter,
  },
];
