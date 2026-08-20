import { DatePipe } from '@angular/common';
import { inject, InjectionToken, Provider } from '@angular/core';
import { createAngularTimeDisplayAdapter } from '../adapters/angular/angular-time-display-adapter';
import { createNativeTimeDisplayAdapter } from '../adapters/native/native-time-display-adapter';
import { TimeDisplayAdapter } from '../ports/time-display-adapter';

/** Angular token for the active temporal display implementation. */
export const TIME_DISPLAY_ADAPTER = new InjectionToken<TimeDisplayAdapter>(
  'TIME_DISPLAY_ADAPTER',
  {
    providedIn: 'root',
    factory: createNativeTimeDisplayAdapter,
  },
);

/**
 * Registers a temporal display adapter for Angular consumers.
 *
 * @param adapter - Adapter implementation to provide.
 * @returns Angular provider configuration.
 */
export function provideTimeDisplayAdapter(
  adapter: TimeDisplayAdapter,
): Provider {
  return { provide: TIME_DISPLAY_ADAPTER, useValue: adapter };
}

/**
 * Registers Angular's `DatePipe` as the active localized display adapter.
 *
 * @param defaultTimeZone - Fallback zone used when a view supplies no zone.
 * @returns Angular providers for the adapter and its `DatePipe`.
 */
export function provideAngularTimeDisplayAdapter(
  defaultTimeZone = 'UTC',
): Provider[] {
  return [
    DatePipe,
    {
      provide: TIME_DISPLAY_ADAPTER,
      useFactory: () =>
        createAngularTimeDisplayAdapter(inject(DatePipe), defaultTimeZone),
    },
  ];
}
