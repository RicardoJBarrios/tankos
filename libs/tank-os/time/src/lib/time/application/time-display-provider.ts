import {
  DATE_PIPE_DEFAULT_OPTIONS,
  DATE_PIPE_DEFAULT_TIMEZONE,
  DatePipe,
} from '@angular/common';
import { inject, InjectionToken, LOCALE_ID, Provider } from '@angular/core';
import { createAngularTimeDisplayAdapter } from '../adapters/angular/angular-time-display-adapter';
import { TimeDisplayAdapter } from '../ports/time-display-adapter';

/** Angular token for the active temporal display implementation. */
export const TIME_DISPLAY_ADAPTER = new InjectionToken<TimeDisplayAdapter>(
  'TIME_DISPLAY_ADAPTER',
  {
    providedIn: 'root',
    factory: createDefaultAngularTimeDisplayAdapter,
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
): Provider {
  return {
    provide: TIME_DISPLAY_ADAPTER,
    useFactory: () =>
      createConfiguredAngularTimeDisplayAdapter(defaultTimeZone),
  };
}

function createDefaultAngularTimeDisplayAdapter(): TimeDisplayAdapter {
  return createConfiguredAngularTimeDisplayAdapter('UTC');
}

function createConfiguredAngularTimeDisplayAdapter(
  defaultTimeZone: string,
): TimeDisplayAdapter {
  return createAngularTimeDisplayAdapter(
    new DatePipe(
      inject(LOCALE_ID),
      inject(DATE_PIPE_DEFAULT_TIMEZONE, { optional: true }),
      inject(DATE_PIPE_DEFAULT_OPTIONS, { optional: true }),
    ),
    defaultTimeZone,
  );
}
