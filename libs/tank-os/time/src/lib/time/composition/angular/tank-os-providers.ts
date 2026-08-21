import { Provider } from '@angular/core';
import {
  provideTimePort,
  provideTimeClock,
  provideTimeZoneDatabase,
} from './time-port-provider';
import { provideAngularTimeDisplayAdapter } from './time-display-provider';

/** Registers the default temporal ports, clock and Angular display. */
export function provideTankOsTime(): Provider[] {
  return [
    provideTimePort(),
    provideTimeZoneDatabase(),
    provideTimeClock(),
    provideAngularTimeDisplayAdapter(),
  ];
}
