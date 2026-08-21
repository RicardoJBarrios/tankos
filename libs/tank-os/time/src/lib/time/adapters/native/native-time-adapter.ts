import { TimeAdapter } from '../../core';
import { nativeIsValidInstant } from './native-instant-validation';
import { nativeParseInstant } from './native-instant-parsing';
import { nativeToUtcIsoString } from './native-instant-serialization';
import { nativeIsValidLocalDate } from './native-local-date-validation';
import { nativeParseLocalDate } from './native-local-date-parsing';
import { nativeFromZonedDateTime } from './native-zoned-date-time-resolution';
import { nativeIsValidTimeZone } from './native-time-zone-validation';
import { nativeIsValidDuration } from './native-duration-validation';
import { nativeParseDuration } from './native-duration-parsing';
import { nativeToDurationIsoString } from './native-duration-serialization';

/**
 * Creates the adapter backed by the current JavaScript/Intl runtime.
 *
 * @returns A complete native implementation of the `TimeAdapter` port.
 */
export function createNativeTimeAdapter(): TimeAdapter {
  return {
    parseInstant: nativeParseInstant,
    isValidInstant: nativeIsValidInstant,
    toUtcIsoString: nativeToUtcIsoString,
    parseDuration: nativeParseDuration,
    isValidDuration: nativeIsValidDuration,
    toDurationIsoString: nativeToDurationIsoString,
    parseLocalDate: nativeParseLocalDate,
    isValidLocalDate: nativeIsValidLocalDate,
    fromZonedDateTime: nativeFromZonedDateTime,
    isValidTimeZone: nativeIsValidTimeZone,
  };
}
