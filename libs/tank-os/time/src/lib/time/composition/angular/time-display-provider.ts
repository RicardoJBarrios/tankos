import { DATE_PIPE_DEFAULT_OPTIONS, DatePipe } from '@angular/common';
import { inject, LOCALE_ID, Provider } from '@angular/core';
import { createAngularTimeDisplayAdapter } from '../../adapters/angular';
import {
  TimeDisplayAdapter,
  TimeDisplayContext,
  TimeLocalePort,
} from '../../core';
import {
  TIME_PORT,
  TIME_DISPLAY_ADAPTER,
  TIME_DISPLAY_CONTEXT,
  TIME_LOCALE,
  TIME_ZONE_DATABASE,
} from '../../application';
import { createAngularTimeLocaleAdapter } from '../../adapters/angular';
import { createNativeTimeZoneDatabase } from '../../adapters/native';

/** Registers a custom temporal display adapter for Angular consumers. */
export function provideTimeDisplayAdapter(
  adapter: TimeDisplayAdapter,
): Provider {
  return { provide: TIME_DISPLAY_ADAPTER, useValue: adapter };
}

/**
 * Registers Angular's `DatePipe` as the active localized display adapter.
 *
 * @param defaultTimeZone - Fallback zone used when a view supplies no zone.
 * @returns Angular provider for the display adapter.
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

/** Registers a replaceable locale source for temporal presentation. */
export function provideTimeLocale(locale: TimeLocalePort): Provider {
  return { provide: TIME_LOCALE, useValue: locale };
}

function createConfiguredAngularTimeDisplayAdapter(
  explicitDefaultTimeZone?: string,
): TimeDisplayAdapter {
  const context = inject(TIME_DISPLAY_CONTEXT, { optional: true }) ?? {};
  const locale =
    inject(TIME_LOCALE, { optional: true }) ??
    createAngularTimeLocaleAdapter(inject(LOCALE_ID));
  return createAngularTimeDisplayAdapter(
    new DatePipe(
      locale.getLocale(),
      undefined,
      inject(DATE_PIPE_DEFAULT_OPTIONS, { optional: true }),
    ),
    inject(TIME_PORT),
    explicitDefaultTimeZone ??
      context.aquariumTimeZone ??
      context.userTimeZone ??
      'UTC',
    inject(TIME_ZONE_DATABASE, { optional: true }) ??
      createNativeTimeZoneDatabase(),
  );
}
