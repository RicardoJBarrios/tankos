import { Provider } from '@angular/core';
import { ClockPort, TimeAdapter } from '../../core';
import {
  createNativeClock,
  createNativeTimeAdapter,
} from '../../adapters/native';
import { TIME_ADAPTER, TIME_CLOCK } from '../../application';

/** Registers the selected time adapter for Angular consumers. */
export function provideTimeAdapter(
  adapter: TimeAdapter = createNativeTimeAdapter(),
): Provider {
  return { provide: TIME_ADAPTER, useValue: adapter };
}

/** Registers the selected clock for Angular consumers. */
export function provideTimeClock(
  clock: ClockPort = createNativeClock(),
): Provider {
  return { provide: TIME_CLOCK, useValue: clock };
}
