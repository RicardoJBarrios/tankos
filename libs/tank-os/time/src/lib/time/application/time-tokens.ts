import { InjectionToken } from '@angular/core';
import {
  ClockPort,
  TimeAdapter,
  TimeDisplayAdapter,
  TimeDisplayContext,
  TimeLocalePort,
  TimeZoneDatabasePort,
} from '../core';

/** Angular token for the active time implementation. */
export const TIME_ADAPTER = new InjectionToken<TimeAdapter>('TIME_ADAPTER');

/** Angular token for the active current-time source. */
export const TIME_CLOCK = new InjectionToken<ClockPort>('TIME_CLOCK');

/** Angular token for the zones available to temporal presentation. */
export const TIME_DISPLAY_CONTEXT = new InjectionToken<TimeDisplayContext>(
  'TIME_DISPLAY_CONTEXT',
);

/** Angular token for the active temporal display implementation. */
export const TIME_DISPLAY_ADAPTER = new InjectionToken<TimeDisplayAdapter>(
  'TIME_DISPLAY_ADAPTER',
);

/** Angular token for the active locale source used by temporal presentation. */
export const TIME_LOCALE = new InjectionToken<TimeLocalePort>('TIME_LOCALE');

/** Angular token for the active IANA time-zone rules source. */
export const TIME_ZONE_DATABASE = new InjectionToken<TimeZoneDatabasePort>(
  'TIME_ZONE_DATABASE',
);
