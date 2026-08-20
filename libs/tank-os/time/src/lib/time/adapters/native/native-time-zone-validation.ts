import { getFormatter } from './native-time-zone-runtime';

/**
 * Checks whether the runtime recognizes an IANA time-zone identifier.
 *
 * @param timeZone - IANA time-zone identifier.
 * @returns `true` when `Intl` can construct a formatter for the zone.
 */
export function nativeIsValidTimeZone(timeZone: string): boolean {
  if (!timeZone) {
    return false;
  }

  try {
    getFormatter(timeZone);
    return true;
  } catch {
    return false;
  }
}
