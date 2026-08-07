import { InjectionToken } from '@angular/core';
import {
  AquariumRepository,
  KeeperSession,
} from '../application/aquarium-ports';

export const AQUARIUM_REPOSITORY = new InjectionToken<AquariumRepository>(
  'AQUARIUM_REPOSITORY',
);

export const KEEPER_SESSION = new InjectionToken<KeeperSession>(
  'KEEPER_SESSION',
);
