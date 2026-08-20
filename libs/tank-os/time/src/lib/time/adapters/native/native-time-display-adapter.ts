import { nativeParseInstant } from './native-instant-parsing';
import { nativeParseLocalDate } from './native-local-date-parsing';
import { TimeDisplayAdapter } from '../../ports/time-display-adapter';

const DEFAULT_LOCALE = 'en-GB';
const DEFAULT_TIME_ZONE = 'UTC';
const DEFAULT_DATE_STYLE = 'medium';
const DEFAULT_TIME_STYLE = 'short';

/**
 * Creates the native locale formatter used by the presentation adapter.
 *
 * @returns A formatter implementation backed by `Intl.DateTimeFormat`.
 */
export function createNativeTimeDisplayAdapter(): TimeDisplayAdapter {
  return {
    formatInstant(value, options) {
      const instant = nativeParseInstant(value);
      return new Intl.DateTimeFormat(options?.locale ?? DEFAULT_LOCALE, {
        dateStyle: options?.dateStyle ?? DEFAULT_DATE_STYLE,
        timeStyle: options?.timeStyle ?? DEFAULT_TIME_STYLE,
        timeZone: options?.timeZone ?? DEFAULT_TIME_ZONE,
      }).format(new Date(instant.epochMilliseconds));
    },
    formatLocalDate(value, options) {
      const localDate =
        typeof value === 'string' ? nativeParseLocalDate(value) : value;
      return new Intl.DateTimeFormat(options?.locale ?? DEFAULT_LOCALE, {
        dateStyle: options?.dateStyle ?? DEFAULT_DATE_STYLE,
        timeZone: DEFAULT_TIME_ZONE,
      }).format(
        new Date(Date.UTC(localDate.year, localDate.month - 1, localDate.day)),
      );
    },
  };
}
