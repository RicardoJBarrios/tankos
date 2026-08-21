import { Provider } from '@angular/core';
import { provideTimeAdapter, provideTimeClock } from './time-adapter-provider';
import { provideAngularTimeDisplayAdapter } from './time-display-provider';

/** Registers the default native clock, time adapter and Angular display. */
export function provideTankOsTime(): Provider[] {
  return [
    provideTimeAdapter(),
    provideTimeClock(),
    provideAngularTimeDisplayAdapter(),
  ];
}
