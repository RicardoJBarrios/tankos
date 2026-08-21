import { InjectionToken } from '@angular/core';
import {
  ClockPort,
  TimeAdapter,
  TimeDisplayAdapter,
  TimeDisplayContext,
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
