import {
  DATE_PIPE_DEFAULT_OPTIONS,
  DATE_PIPE_DEFAULT_TIMEZONE,
  DatePipe,
} from '@angular/common';
import { inject, InjectionToken, LOCALE_ID, Provider } from '@angular/core';
import { createAngularTimeDisplayAdapter } from '../adapters/angular';
import { TimeDisplayAdapter, TimeDisplayContext } from '../ports';
import { TIME_ADAPTER } from './time-provider';

/** Angular token for the zones available to temporal presentation. */
export const TIME_DISPLAY_CONTEXT = new InjectionToken<TimeDisplayContext>(
  'TIME_DISPLAY_CONTEXT',
  { providedIn: 'root', factory: () => ({}) },
);

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
  defaultTimeZone?: string,
): Provider {
  return {
    provide: TIME_DISPLAY_ADAPTER,
    useFactory: () =>
      createConfiguredAngularTimeDisplayAdapter(defaultTimeZone),
  };
}

/** Registers aquarium and user zones used by the display fallback policy. */
export function provideTimeDisplayContext(
  context: TimeDisplayContext,
): Provider {
  return { provide: TIME_DISPLAY_CONTEXT, useValue: context };
}

function createDefaultAngularTimeDisplayAdapter(): TimeDisplayAdapter {
  return createConfiguredAngularTimeDisplayAdapter();
}

function createConfiguredAngularTimeDisplayAdapter(
  explicitDefaultTimeZone?: string,
): TimeDisplayAdapter {
  const context = inject(TIME_DISPLAY_CONTEXT);
  return createAngularTimeDisplayAdapter(
    new DatePipe(
      inject(LOCALE_ID),
      inject(DATE_PIPE_DEFAULT_TIMEZONE, { optional: true }),
      inject(DATE_PIPE_DEFAULT_OPTIONS, { optional: true }),
    ),
    inject(TIME_ADAPTER),
    explicitDefaultTimeZone ??
      context.aquariumTimeZone ??
      context.userTimeZone ??
      'UTC',
  );
}
