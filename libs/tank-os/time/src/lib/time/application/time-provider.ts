import { InjectionToken, Provider } from '@angular/core';
import { createNativeTimeAdapter } from '../adapters/native/native-time-adapter';
import { TimeAdapter } from '../ports/time-adapter';

/** Angular token for the active time implementation. */
export const TIME_ADAPTER = new InjectionToken<TimeAdapter>('TIME_ADAPTER', {
  providedIn: 'root',
  factory: createNativeTimeAdapter,
});

/**
 * Registers a time adapter for Angular consumers.
 *
 * @param adapter - Adapter implementation to provide.
 * @returns Angular provider configuration.
 */
export function provideTimeAdapter(adapter: TimeAdapter): Provider {
  return { provide: TIME_ADAPTER, useValue: adapter };
}
