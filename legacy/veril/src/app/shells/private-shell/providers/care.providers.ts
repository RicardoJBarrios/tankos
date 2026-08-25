import { Provider } from '@angular/core';
import { FirestoreCareWorkRepository } from '../../../care/infrastructure/firestore-care-work-repository';
import { FirestorePlannedCareWorkRepository } from '../../../care/infrastructure/firestore-planned-care-work-repository';
import { FirestoreAquariumRepository } from '../../../aquarium-management/infrastructure/firestore-aquarium-repository';
import {
  CARE_AQUARIUM_CONTEXT_READER,
  CARE_WORK_READER,
  CARE_WORK_WRITER,
  PLANNED_CARE_WORK_CANCELLER,
  PLANNED_CARE_WORK_COMPLETER,
  PLANNED_CARE_WORK_READER,
  PLANNED_CARE_WORK_WRITER,
  RECURRING_CARE_PLAN_STOPPER,
  RECURRING_CARE_PLAN_WRITER,
} from '../../../care/ui/providers';

export const PRIVATE_CARE_PROVIDERS: Provider[] = [
  { provide: CARE_WORK_WRITER, useClass: FirestoreCareWorkRepository },
  { provide: CARE_WORK_READER, useClass: FirestoreCareWorkRepository },
  {
    provide: PLANNED_CARE_WORK_WRITER,
    useClass: FirestorePlannedCareWorkRepository,
  },
  {
    provide: PLANNED_CARE_WORK_READER,
    useClass: FirestorePlannedCareWorkRepository,
  },
  {
    provide: PLANNED_CARE_WORK_COMPLETER,
    useClass: FirestorePlannedCareWorkRepository,
  },
  {
    provide: PLANNED_CARE_WORK_CANCELLER,
    useClass: FirestorePlannedCareWorkRepository,
  },
  {
    provide: RECURRING_CARE_PLAN_WRITER,
    useClass: FirestorePlannedCareWorkRepository,
  },
  {
    provide: RECURRING_CARE_PLAN_STOPPER,
    useClass: FirestorePlannedCareWorkRepository,
  },
  {
    provide: CARE_AQUARIUM_CONTEXT_READER,
    useClass: FirestoreAquariumRepository,
  },
];
