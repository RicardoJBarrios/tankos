import { TimeLocalePort } from '../../core';

/**
 * Creates a locale port backed by a caller-provided locale source.
 *
 * @param locale - Locale identifier supplied by the Angular composition layer
 * or another localization integration.
 * @returns A locale port that returns the supplied locale.
 */
export function createAngularTimeLocaleAdapter(locale: string): TimeLocalePort {
  return { getLocale: () => locale };
}
