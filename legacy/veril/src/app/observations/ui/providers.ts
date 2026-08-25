import { InjectionToken } from '@angular/core';
import {
  ObservationAquariumContextReader,
  ObservationReader,
  ObservationWriter,
} from '../application/ports';
export { KEEPER_SESSION } from '../../shared/ui/providers';

export const OBSERVATION_WRITER = new InjectionToken<ObservationWriter>(
  'OBSERVATION_WRITER',
);
export const OBSERVATION_READER = new InjectionToken<ObservationReader>(
  'OBSERVATION_READER',
);
export const OBSERVATION_AQUARIUM_CONTEXT_READER =
  new InjectionToken<ObservationAquariumContextReader>(
    'OBSERVATION_AQUARIUM_CONTEXT_READER',
  );
