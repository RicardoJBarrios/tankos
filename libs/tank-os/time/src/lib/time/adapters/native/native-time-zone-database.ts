import { TimeZoneDatabasePort } from '../../core';
import { getTimeZoneOffset } from './native-time-zone-runtime';
import { nativeIsValidTimeZone } from './native-time-zone-validation';

/** Creates the IANA database adapter backed by the runtime's `Intl` TZDB. */
export function createNativeTimeZoneDatabase(): TimeZoneDatabasePort {
  return {
    isValid: nativeIsValidTimeZone,
    getOffsetMinutes(instant, timeZone) {
      if (!nativeIsValidTimeZone(timeZone)) {
        throw new RangeError(`Invalid time zone: ${timeZone}`);
      }
      return getTimeZoneOffset(instant.epochMilliseconds, timeZone) / 60_000;
    },
  };
}
