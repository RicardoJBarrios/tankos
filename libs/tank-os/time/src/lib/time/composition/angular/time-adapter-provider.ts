import { inject, Provider } from '@angular/core';
import { ClockPort, TimeAdapter, TimeZoneDatabasePort } from '../../core';
import {
  createNativeClock,
  createNativeTimeAdapter,
  createNativeTimeZoneDatabase,
} from '../../adapters/native';
import {
  TIME_ADAPTER,
  TIME_CLOCK,
  TIME_ZONE_DATABASE,
} from '../../application';

/**
 * Registers the selected time adapter for Angular consumers.
 *
 * @param adapter - Optional custom adapter; native implementation otherwise.
 */
export function provideTimeAdapter(adapter?: TimeAdapter): Provider {
  return {
    provide: TIME_ADAPTER,
    useFactory: () =>
      adapter ??
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

/** Registers the selected clock for Angular consumers. */
export function provideTimeClock(
  clock: ClockPort = createNativeClock(),
): Provider {
  return { provide: TIME_CLOCK, useValue: clock };
}
