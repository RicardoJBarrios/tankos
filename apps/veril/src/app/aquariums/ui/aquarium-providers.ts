import { InjectionToken } from '@angular/core';
import {
  AquariumRepository,
  AquariumReader,
  KeeperSession,
  MeasurementWriter,
  ObservationWriter,
} from '../application/aquarium-ports';

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
