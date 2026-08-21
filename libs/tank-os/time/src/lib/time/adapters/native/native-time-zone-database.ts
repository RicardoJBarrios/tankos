import { TimeZoneDatabasePort } from '../../core';
import { createUtcTimestamp } from './native-calendar-date';
import { parseLocalDateTime } from './native-local-date-time-parsing';
import {
  getCandidateOffsets,
  getTimeZoneOffset,
} from './native-time-zone-offset';
import { getLocalParts, sameDateTime } from './native-time-zone-local-parts';
import { nativeIsValidTimeZone } from './native-time-zone-validation';

/** Creates the IANA database adapter backed by the runtime's `Intl` TZDB. */
export function createNativeTimeZoneDatabase(): TimeZoneDatabasePort {
  return {
    isValid: nativeIsValidTimeZone,
    resolveLocalDateTime(value, timeZone) {
      if (!nativeIsValidTimeZone(timeZone)) {
        throw new RangeError(`Invalid time zone: ${timeZone}`);
      }

      const localParts = parseLocalDateTime(value);
      const localAsUtc = createUtcTimestamp(localParts);
      const candidates = new Set<number>();

      for (const offset of getCandidateOffsets(localAsUtc, timeZone)) {
        const candidate = localAsUtc - offset;
        const candidateParts = getLocalParts(candidate, timeZone);
        if (sameDateTime(candidateParts, localParts)) {
          candidates.add(candidate);
        }
      }

      if (candidates.size === 0) {
        throw new RangeError(
          `Local date-time does not exist in ${timeZone}: ${value}`,
        );
      }
      if (candidates.size > 1) {
        throw new RangeError(
          `Local date-time is ambiguous in ${timeZone}: ${value}`,
        );
      }

      return { kind: 'instant', epochMilliseconds: [...candidates][0] };
    },
    getOffsetMinutes(instant, timeZone) {
      if (!nativeIsValidTimeZone(timeZone)) {
        throw new RangeError(`Invalid time zone: ${timeZone}`);
      }
      return getTimeZoneOffset(instant.epochMilliseconds, timeZone) / 60_000;
    },
  };
}
