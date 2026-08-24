import { Provider } from '@angular/core';
import { FirestoreAquariumAccessService } from '../../shared-access/infrastructure/firestore-aquarium-access-service';
import {
  AQUARIUM_ACCESS_SERVICE,
  SHARED_MEASUREMENT_HISTORY_READER,
} from '../../shared-access/ui/providers';
import { FirestoreSharedMeasurementHistoryReader } from './firestore-shared-measurement-history-reader';

export const SHARED_ACCESS_PROVIDERS: Provider[] = [
  FirestoreAquariumAccessService,
  {
    provide: AQUARIUM_ACCESS_SERVICE,
    useExisting: FirestoreAquariumAccessService,
  },
  {
    provide: SHARED_MEASUREMENT_HISTORY_READER,
    useClass: FirestoreSharedMeasurementHistoryReader,
  },
];
