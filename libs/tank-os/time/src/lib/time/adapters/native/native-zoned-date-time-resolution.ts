import { parseLocalDateTime } from './native-local-date-time-parsing';
import {
  getCandidateOffsets,
  getLocalParts,
  sameDateTime,
} from './native-time-zone-runtime';
import { createUtcTimestamp } from './native-calendar-date';
import {
  Instant,
  TimeZoneDatabasePort,
  ZonedDateTimeResolution,
} from '../../core';

/**
 * Resolves a local date-time in an IANA zone to a unique instant.
 *
 * @param value - Local ISO date-time without a zone designator.
 * @param timeZone - IANA time-zone identifier.
 * @param timeZoneDatabase - Source of the IANA zone rules.
 * @returns The resolved UTC instant.
 * @throws `RangeError` for invalid zones, nonexistent local times or DST
 * ambiguous local times.
 */
export function nativeFromZonedDateTime(
  value: string,
  timeZone: string,
  timeZoneDatabase: TimeZoneDatabasePort,
): Instant {
  if (!timeZoneDatabase.isValid(timeZone)) {
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
}

/** Resolves a local date-time and retains its declared IANA zone and offset. */
export function nativeResolveZonedDateTime(
  value: string,
  timeZone: string,
  timeZoneDatabase: TimeZoneDatabasePort,
): ZonedDateTimeResolution {
  const instant = nativeFromZonedDateTime(value, timeZone, timeZoneDatabase);
  return {
    instant,
    origin: {
      declaredTimeZone: timeZone,
      declaredOffsetMinutes: timeZoneDatabase.getOffsetMinutes(
        instant,
        timeZone,
      ),
    },
  };
}
