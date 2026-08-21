import { TimePort } from '../../core';
import { nativeIsValidInstant } from './native-instant-validation';
import { nativeParseInstant } from './native-instant-parsing';
import { nativeToUtcIsoString } from './native-instant-serialization';
import { nativeIsValidLocalDate } from './native-local-date-validation';
import { nativeParseLocalDate } from './native-local-date-parsing';
import {
  nativeFromZonedDateTime,
  nativeResolveOffsetDateTime,
  nativeResolveZonedDateTime,
} from './native-zoned-date-time-resolution';
import { createNativeTimeZoneDatabase } from './native-time-zone-database';
import { nativeIsValidDuration } from './native-duration-validation';
import { nativeParseDuration } from './native-duration-parsing';
import { nativeToDurationIsoString } from './native-duration-serialization';
import { nativeDurationBetween } from './native-duration-between';
import { nativeAddDuration } from './native-add-duration';
import {
  nativeCompareDurations,
  nativeCompareInstants,
} from './native-temporal-comparison';
import {
  nativeClamp,
  nativeContains,
  nativeCreateInterval,
} from './native-time-interval';
import { nativeAddLocalDate } from './native-local-date-arithmetic';
import { nativeDurationBetweenLocalDates } from './native-local-date-difference';

/**
 * Creates the adapter backed by the current JavaScript/Intl runtime.
 *
 * @param timeZoneDatabase - Optional IANA rules source; defaults to `Intl`.
 * @returns A complete native implementation of the composed temporal ports.
 */
export function createNativeTimeAdapter(
  timeZoneDatabase = createNativeTimeZoneDatabase(),
): TimePort {
  return {
    parseInstant: nativeParseInstant,
    isValidInstant: nativeIsValidInstant,
    toUtcIsoString: nativeToUtcIsoString,
    parseDuration: nativeParseDuration,
    isValidDuration: nativeIsValidDuration,
    toDurationIsoString: nativeToDurationIsoString,
    durationBetween: nativeDurationBetween,
    addDuration: nativeAddDuration,
    compareInstants: nativeCompareInstants,
    compareDurations: nativeCompareDurations,
    createInterval: nativeCreateInterval,
    contains: nativeContains,
    clamp: nativeClamp,
    addLocalDate: nativeAddLocalDate,
    durationBetweenLocalDates: nativeDurationBetweenLocalDates,
    parseLocalDate: nativeParseLocalDate,
    isValidLocalDate: nativeIsValidLocalDate,
    fromZonedDateTime: (value, timeZone) =>
      nativeFromZonedDateTime(value, timeZone, timeZoneDatabase),
    resolveZonedDateTime: (value, timeZone) =>
      nativeResolveZonedDateTime(value, timeZone, timeZoneDatabase),
    resolveOffsetDateTime: nativeResolveOffsetDateTime,
    isValidTimeZone: timeZoneDatabase.isValid,
  };
}
