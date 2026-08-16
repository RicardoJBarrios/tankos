import { Provider } from '@angular/core';
import { FirestoreLivestockRepository } from '../../../livestock/infrastructure/firestore-livestock-repository';
import {
  LIVESTOCK_READER,
  LIVESTOCK_WRITER,
} from '../../../livestock/ui/providers';

export const PRIVATE_LIVESTOCK_PROVIDERS: Provider[] = [
  { provide: LIVESTOCK_READER, useClass: FirestoreLivestockRepository },
  { provide: LIVESTOCK_WRITER, useClass: FirestoreLivestockRepository },
];
