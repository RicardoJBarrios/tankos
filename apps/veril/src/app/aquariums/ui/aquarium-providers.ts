import { InjectionToken } from '@angular/core';
import {
  AquariumRepository,
  AquariumReader,
  CareWorkWriter,
  CurrentMeasurementReader,
  CareWorkReader,
  KeeperSession,
  MeasurementReader,
  MeasurementWriter,
  ObservationReader,
  ObservationWriter,
  TimelineMeasurementReader,
  TimelineObservationReader,
} from '../application/aquarium-ports';
import { ActiveAquariumContextStorage } from '../application/active-aquarium-context-storage';

export const AQUARIUM_REPOSITORY = new InjectionToken<
  AquariumRepository & AquariumReader
>('AQUARIUM_REPOSITORY');

export const KEEPER_SESSION = new InjectionToken<KeeperSession>(
  'KEEPER_SESSION',
);

export const OBSERVATION_WRITER = new InjectionToken<ObservationWriter>(
  'OBSERVATION_WRITER',
);

export const OBSERVATION_READER = new InjectionToken<ObservationReader>(
  'OBSERVATION_READER',
);

export const MEASUREMENT_WRITER = new InjectionToken<MeasurementWriter>(
  'MEASUREMENT_WRITER',
);

export const MEASUREMENT_READER = new InjectionToken<MeasurementReader>(
  'MEASUREMENT_READER',
);

export const CURRENT_MEASUREMENT_READER =
  new InjectionToken<CurrentMeasurementReader>('CURRENT_MEASUREMENT_READER');

export const TIMELINE_OBSERVATION_READER =
  new InjectionToken<TimelineObservationReader>('TIMELINE_OBSERVATION_READER');

export const TIMELINE_MEASUREMENT_READER =
  new InjectionToken<TimelineMeasurementReader>('TIMELINE_MEASUREMENT_READER');

export const CARE_WORK_WRITER = new InjectionToken<CareWorkWriter>(
  'CARE_WORK_WRITER',
);

export const CARE_WORK_READER = new InjectionToken<CareWorkReader>(
  'CARE_WORK_READER',
);

export const ACTIVE_AQUARIUM_CONTEXT_STORAGE =
  new InjectionToken<ActiveAquariumContextStorage>(
    'ACTIVE_AQUARIUM_CONTEXT_STORAGE',
  );
