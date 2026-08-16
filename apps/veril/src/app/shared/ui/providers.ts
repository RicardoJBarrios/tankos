import { InjectionToken } from '@angular/core';
import { KeeperSession } from '../application/keeper-session';
import { ActiveAquariumContextStorage } from '../../shared/application/active-aquarium-context-storage';

export const KEEPER_SESSION = new InjectionToken<KeeperSession>(
  'KEEPER_SESSION',
);

export const ACTIVE_AQUARIUM_CONTEXT_STORAGE =
  new InjectionToken<ActiveAquariumContextStorage>(
    'ACTIVE_AQUARIUM_CONTEXT_STORAGE',
  );
