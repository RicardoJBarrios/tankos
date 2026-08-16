import { Provider } from '@angular/core';
import { FirestoreObservationRepository } from '../../../observations/infrastructure/firestore-observation-repository';
import { FirestoreAquariumRepository } from '../../../aquarium-management/infrastructure/firestore-aquarium-repository';
import {
  OBSERVATION_AQUARIUM_CONTEXT_READER,
  OBSERVATION_READER,
  OBSERVATION_WRITER,
} from '../../../observations/ui/providers';

export const PRIVATE_OBSERVATION_PROVIDERS: Provider[] = [
  { provide: OBSERVATION_WRITER, useClass: FirestoreObservationRepository },
  { provide: OBSERVATION_READER, useClass: FirestoreObservationRepository },
  {
    provide: OBSERVATION_AQUARIUM_CONTEXT_READER,
    useClass: FirestoreAquariumRepository,
  },
];
