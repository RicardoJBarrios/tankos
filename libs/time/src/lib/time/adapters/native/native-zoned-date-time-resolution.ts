import {
  Instant,
  TimeZoneDatabasePort,
  ZonedDateTimeResolution,
} from '../../core';

const MAX_OFFSET_HOURS = 23;
const MINUTES_PER_HOUR = 60;
const MAX_OFFSET_MINUTES = 59;
const MILLISECONDS_PER_MINUTE = 60_000;

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
  return timeZoneDatabase.resolveLocalDateTime(value, timeZone);
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
      sourceTimeZone: timeZone,
      resolvedOffsetMinutes: timeZoneDatabase.getOffsetMinutes(
        instant,
        timeZone,
      ),
    },
  };
}

/** Resolves a local date-time with a fixed numeric offset. */
export function nativeResolveOffsetDateTime(
  value: string,
  offsetMinutes: number,
): ZonedDateTimeResolution {
  if (
    !Number.isInteger(offsetMinutes) ||
    Math.abs(offsetMinutes) >
      MAX_OFFSET_HOURS * MINUTES_PER_HOUR + MAX_OFFSET_MINUTES
  ) {
    throw new RangeError(`Invalid time-zone offset: ${String(offsetMinutes)}`);
  }

  const localAsUtc = createUtcTimestamp(parseLocalDateTime(value));

  return {
    instant: {
      kind: 'instant',
      epochMilliseconds: localAsUtc - offsetMinutes * MILLISECONDS_PER_MINUTE,
    },
    origin: {
      sourceOffsetMinutes: offsetMinutes,
      resolvedOffsetMinutes: offsetMinutes,
    },
  };
}
import { parseLocalDateTime } from './native-local-date-time-parsing';
import { createUtcTimestamp } from './native-calendar-date';
