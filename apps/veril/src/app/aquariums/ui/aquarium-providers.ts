import { InjectionToken } from '@angular/core';
import {
  AquariumRepository,
  AquariumReader,
  KeeperSession,
  MeasurementReader,
  MeasurementWriter,
  ObservationWriter,
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

export const MEASUREMENT_WRITER = new InjectionToken<MeasurementWriter>(
  'MEASUREMENT_WRITER',
);

export const MEASUREMENT_READER = new InjectionToken<MeasurementReader>(
  'MEASUREMENT_READER',
);

export const ACTIVE_AQUARIUM_CONTEXT_STORAGE =
  new InjectionToken<ActiveAquariumContextStorage>(
    'ACTIVE_AQUARIUM_CONTEXT_STORAGE',
  );
