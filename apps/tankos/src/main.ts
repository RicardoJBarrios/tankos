import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

bootstrapApplication(App, appConfig).catch((error: unknown) => {
  // The bootstrap boundary must report startup failures without an unhandled rejection.
  // eslint-disable-next-line no-console
  console.error(error);
});
