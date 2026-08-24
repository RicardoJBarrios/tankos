import { inject, Provider } from '@angular/core';
import { ClockPort, TimePort, TimeZoneDatabasePort } from '../../core';
import {
  createNativeClock,
  createNativeTimeAdapter,
  createNativeTimeZoneDatabase,
} from '../../adapters/native';
import { TIME_PORT, TIME_CLOCK, TIME_ZONE_DATABASE } from '../../application';

/**
 * Registers the complete temporal port for Angular consumers.
 *
 * @param timePort - Optional custom port; native implementation otherwise.
 */
export function provideTimePort(timePort?: TimePort): Provider {
  return {
    provide: TIME_PORT,
    useFactory: () =>
      timePort ??
      createNativeTimeAdapter(
        inject(TIME_ZONE_DATABASE, { optional: true }) ??
          createNativeTimeZoneDatabase(),
      ),
  };
}

/** Registers the replaceable IANA time-zone rules source. */
export function provideTimeZoneDatabase(
  database: TimeZoneDatabasePort = createNativeTimeZoneDatabase(),
): Provider {
  return { provide: TIME_ZONE_DATABASE, useValue: database };
}

/** Registers the selected clock for temporal services. */
export function provideTimeClock(
  clock: ClockPort = createNativeClock(),
): Provider {
  return { provide: TIME_CLOCK, useValue: clock };
}
