import { inject, Provider } from '@angular/core';
import { ActiveAquariumContext } from '../../../shared/application/active-aquarium-context';
import { ReviewRecentTimeline } from '../../../timeline/application/review-recent-timeline';
import { KEEPER_SESSION } from '../../../shared/ui/providers';
import { FirestoreAquariumRepository } from '../../../aquarium-management/infrastructure/firestore-aquarium-repository';
import { FirestoreCareWorkRepository } from '../../../care/infrastructure/firestore-care-work-repository';
import { FirestoreMeasurementRepository } from '../../../measurements/infrastructure/firestore-measurement-repository';
import { FirestoreObservationRepository } from '../../../observations/infrastructure/firestore-observation-repository';
import {
  TIMELINE_AQUARIUM_CONTEXT_READER,
  TIMELINE_CARE_WORK_READER,
  TIMELINE_MEASUREMENT_READER,
  TIMELINE_OBSERVATION_READER,
} from '../../../timeline/ui/providers';

export const PRIVATE_TIMELINE_PROVIDERS: Provider[] = [
  {
    provide: TIMELINE_OBSERVATION_READER,
    useClass: FirestoreObservationRepository,
  },
  {
    provide: TIMELINE_MEASUREMENT_READER,
    useClass: FirestoreMeasurementRepository,
  },
  { provide: TIMELINE_CARE_WORK_READER, useClass: FirestoreCareWorkRepository },
  {
    provide: TIMELINE_AQUARIUM_CONTEXT_READER,
    useClass: FirestoreAquariumRepository,
  },
  {
    provide: ReviewRecentTimeline,
    useFactory: () =>
      new ReviewRecentTimeline(
        inject(TIMELINE_OBSERVATION_READER),
        inject(TIMELINE_MEASUREMENT_READER),
        inject(TIMELINE_CARE_WORK_READER),
        inject(KEEPER_SESSION),
        inject(ActiveAquariumContext),
      ),
  },
];
