import {
  ApplicationConfig,
  provideBrowserGlobalErrorListeners,
  isDevMode,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { appRoutes } from './app.routes';
import { provideServiceWorker } from '@angular/service-worker';
import {
  provideClientHydration,
  withEventReplay,
} from '@angular/platform-browser';
import { FirebaseAuthenticationSession } from './shared/infrastructure/firebase-authentication-session';
import { AUTHENTICATION_SESSION } from './shared/ui/providers';

export const appConfig: ApplicationConfig = {
  providers: [
    provideClientHydration(withEventReplay()),
    provideBrowserGlobalErrorListeners(),
    provideRouter(appRoutes),
    provideHttpClient(),
    {
      provide: AUTHENTICATION_SESSION,
      useClass: FirebaseAuthenticationSession,
    },
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode(),
      registrationStrategy: 'registerWhenStable:30000',
    }),
  ],
};
