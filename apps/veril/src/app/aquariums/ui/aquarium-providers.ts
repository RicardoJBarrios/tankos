import { InjectionToken } from '@angular/core';
import {
  AquariumRepository,
  AquariumReader,
  AquariumDashboardReader,
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
  PlannedCareWorkReader,
  PlannedCareWorkWriter,
  PlannedCareWorkCompleter,
  PlannedCareWorkCanceller,
  RecurringCarePlanStopper,
  RecurringCarePlanWriter,
  AquariumTimeZoneConfigurer,
  AquariumLocationConfigurer,
  LocationSearch,
  LocalWeatherReader,
  ParameterTargetWriter,
} from '../application/aquarium-ports';
import { ActiveAquariumContextStorage } from '../application/active-aquarium-context-storage';

export const AQUARIUM_REPOSITORY = new InjectionToken<
  AquariumRepository & AquariumReader
>('AQUARIUM_REPOSITORY');

export const AQUARIUM_DASHBOARD_READER =
  new InjectionToken<AquariumDashboardReader>('AQUARIUM_DASHBOARD_READER');

export const PARAMETER_TARGET_WRITER =
  new InjectionToken<ParameterTargetWriter>('PARAMETER_TARGET_WRITER');

export const AQUARIUM_TIME_ZONE_CONFIGURER =
  new InjectionToken<AquariumTimeZoneConfigurer>(
    'AQUARIUM_TIME_ZONE_CONFIGURER',
  );

export const AQUARIUM_LOCATION_CONFIGURER =
  new InjectionToken<AquariumLocationConfigurer>(
    'AQUARIUM_LOCATION_CONFIGURER',
  );

export const LOCATION_SEARCH = new InjectionToken<LocationSearch>(
  'LOCATION_SEARCH',
);

export const LOCAL_WEATHER_READER = new InjectionToken<LocalWeatherReader>(
  'LOCAL_WEATHER_READER',
);

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

export const PLANNED_CARE_WORK_WRITER =
  new InjectionToken<PlannedCareWorkWriter>('PLANNED_CARE_WORK_WRITER');

export const PLANNED_CARE_WORK_READER =
  new InjectionToken<PlannedCareWorkReader>('PLANNED_CARE_WORK_READER');

export const PLANNED_CARE_WORK_COMPLETER =
  new InjectionToken<PlannedCareWorkCompleter>('PLANNED_CARE_WORK_COMPLETER');

export const PLANNED_CARE_WORK_CANCELLER =
  new InjectionToken<PlannedCareWorkCanceller>('PLANNED_CARE_WORK_CANCELLER');

export const RECURRING_CARE_PLAN_WRITER =
  new InjectionToken<RecurringCarePlanWriter>('RECURRING_CARE_PLAN_WRITER');

export const RECURRING_CARE_PLAN_STOPPER =
  new InjectionToken<RecurringCarePlanStopper>('RECURRING_CARE_PLAN_STOPPER');

export const ACTIVE_AQUARIUM_CONTEXT_STORAGE =
  new InjectionToken<ActiveAquariumContextStorage>(
    'ACTIVE_AQUARIUM_CONTEXT_STORAGE',
  );
