import { TimeAdapter } from '../../core';
import { nativeIsValidInstant } from './native-instant-validation';
import { nativeParseInstant } from './native-instant-parsing';
import { nativeToUtcIsoString } from './native-instant-serialization';
import { nativeIsValidLocalDate } from './native-local-date-validation';
import { nativeParseLocalDate } from './native-local-date-parsing';
import {
  nativeFromZonedDateTime,
  nativeResolveZonedDateTime,
} from './native-zoned-date-time-resolution';
import { createNativeTimeZoneDatabase } from './native-time-zone-database';
import { nativeIsValidDuration } from './native-duration-validation';
import { nativeParseDuration } from './native-duration-parsing';
import { nativeToDurationIsoString } from './native-duration-serialization';

/**
 * Creates the adapter backed by the current JavaScript/Intl runtime.
 *
 * @param timeZoneDatabase - Optional IANA rules source; defaults to `Intl`.
 * @returns A complete native implementation of the `TimeAdapter` port.
 */
export function createNativeTimeAdapter(
  timeZoneDatabase = createNativeTimeZoneDatabase(),
): TimeAdapter {
  return {
    parseInstant: nativeParseInstant,
    isValidInstant: nativeIsValidInstant,
    toUtcIsoString: nativeToUtcIsoString,
    parseDuration: nativeParseDuration,
    isValidDuration: nativeIsValidDuration,
    toDurationIsoString: nativeToDurationIsoString,
    parseLocalDate: nativeParseLocalDate,
    isValidLocalDate: nativeIsValidLocalDate,
    fromZonedDateTime: (value, timeZone) =>
      nativeFromZonedDateTime(value, timeZone, timeZoneDatabase),
    resolveZonedDateTime: (value, timeZone) =>
      nativeResolveZonedDateTime(value, timeZone, timeZoneDatabase),
    isValidTimeZone: timeZoneDatabase.isValid,
  };
}
