import { InjectionToken } from '@angular/core';
import {
  AquariumRepository,
  AquariumReader,
  KeeperSession,
} from '../application/aquarium-ports';

export const AQUARIUM_REPOSITORY = new InjectionToken<
  AquariumRepository & AquariumReader
>('AQUARIUM_REPOSITORY');

export const KEEPER_SESSION = new InjectionToken<KeeperSession>(
  'KEEPER_SESSION',
);
