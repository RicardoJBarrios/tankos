import { inject, Provider } from '@angular/core';
import { ActiveAquariumContext } from '../../../shared/application/active-aquarium-context';
import { FirebaseKeeperSession } from '../../../shared/infrastructure/firebase-keeper-session';
import { SessionStorageActiveAquariumContextStorage } from '../../../shared/infrastructure/session-storage-active-aquarium-context-storage';
import {
  ACTIVE_AQUARIUM_CONTEXT_STORAGE,
  KEEPER_SESSION,
} from '../../../shared/ui/providers';

export const PRIVATE_SHARED_PROVIDERS: Provider[] = [
  {
    provide: ACTIVE_AQUARIUM_CONTEXT_STORAGE,
    useClass: SessionStorageActiveAquariumContextStorage,
  },
  {
    provide: ActiveAquariumContext,
    useFactory: () =>
      new ActiveAquariumContext(inject(ACTIVE_AQUARIUM_CONTEXT_STORAGE)),
  },
  { provide: KEEPER_SESSION, useClass: FirebaseKeeperSession },
];
