import { Provider } from '@angular/core';
import { FirestoreSpeciesProfileDraftWriter } from '../../species-knowledge/infrastructure/firestore-species-profile-draft-writer';
import { FirestoreSpeciesProfileRevisionReader } from '../../species-knowledge/infrastructure/firestore-species-profile-revision-reader';
import { FirestoreSpeciesProfileReader } from '../../species-knowledge/infrastructure/firestore-species-profile-reader';
import {
  PUBLISHED_SPECIES_PROFILE_READER,
  SPECIES_PROFILE_DRAFT_READER,
  SPECIES_PROFILE_DRAFT_WRITER,
  SPECIES_PROFILE_PUBLISHER,
  SPECIES_PROFILE_REVIEWER,
  SPECIES_PROFILE_REVISION_READER,
  SPECIES_PROFILE_RETIRER,
} from '../../species-knowledge/ui/providers';

export const EDITORIAL_PROVIDERS: Provider[] = [
  {
    provide: PUBLISHED_SPECIES_PROFILE_READER,
    useClass: FirestoreSpeciesProfileReader,
  },
  FirestoreSpeciesProfileDraftWriter,
  {
    provide: SPECIES_PROFILE_DRAFT_WRITER,
    useExisting: FirestoreSpeciesProfileDraftWriter,
  },
  {
    provide: SPECIES_PROFILE_DRAFT_READER,
    useExisting: FirestoreSpeciesProfileDraftWriter,
  },
  {
    provide: SPECIES_PROFILE_PUBLISHER,
    useExisting: FirestoreSpeciesProfileDraftWriter,
  },
  {
    provide: SPECIES_PROFILE_REVIEWER,
    useExisting: FirestoreSpeciesProfileDraftWriter,
  },
  {
    provide: SPECIES_PROFILE_REVISION_READER,
    useClass: FirestoreSpeciesProfileRevisionReader,
  },
  {
    provide: SPECIES_PROFILE_RETIRER,
    useExisting: FirestoreSpeciesProfileDraftWriter,
  },
];
