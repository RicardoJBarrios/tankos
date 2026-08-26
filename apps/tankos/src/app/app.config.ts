import {
  ApplicationConfig,
  inject,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideTankOsTime, TIME_CLOCK } from '@tankos/time';
import { AUTH_SESSION, provideAuthSession } from '@tankos/auth';
import { createUnitDefinitionManagementService } from '@tankos/units';
import { createDefaultUnitDefinitionFirestoreRepository } from '@tankos/units-firestore';
import {
  UNIT_DEFINITION_MANAGEMENT_SERVICE,
  UnitDefinitionFeatureService,
} from '@tankos/units-ui';
import { provideRouter } from '@angular/router';
import { appRoutes } from './app.routes';
import { tankosAuthSession, tankosFirestore } from './firebase';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideTankOsTime(),
    provideAuthSession(tankosAuthSession),
    {
      provide: UNIT_DEFINITION_MANAGEMENT_SERVICE,
      useFactory: () =>
        createUnitDefinitionManagementService(
          createDefaultUnitDefinitionFirestoreRepository({
            firestore: tankosFirestore,
            clock: inject(TIME_CLOCK),
          }),
        ),
    },
    {
      provide: UnitDefinitionFeatureService,
      useFactory: () =>
        new UnitDefinitionFeatureService(
          inject(UNIT_DEFINITION_MANAGEMENT_SERVICE),
          inject(AUTH_SESSION),
        ),
    },
    provideRouter(appRoutes),
  ],
};
