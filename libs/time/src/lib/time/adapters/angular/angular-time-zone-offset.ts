import { padLeft } from '@tankos/formatting';
import { Instant, TimeZoneDatabasePort } from '../../core';

const OFFSET_PATTERN = /^(?<sign>[+-])(?<hours>\d{2}):?(?<minutes>\d{2})$/u;
const MINUTES_PER_HOUR = 60;
const MAX_OFFSET_HOURS = 23;
const MAX_OFFSET_MINUTES = 59;
const OFFSET_COMPONENT_WIDTH = 2;

/**
 * Converts a time zone identifier into the numeric offset accepted by
 * Angular's `DatePipe` for a particular instant.
 *
 * @param timeZone - An IANA identifier, UTC, or an explicit numeric offset.
 * @param epochMilliseconds - The instant at which the offset is required.
 * @param timeZoneDatabase - IANA rules source for named zones.
 * @returns A `DatePipe`-compatible offset such as `+0100`.
 */
export function toDatePipeTimeZone(
  timeZone: string,
  epochMilliseconds: number,
  timeZoneDatabase: TimeZoneDatabasePort,
): string {
  if (timeZone === 'UTC' || timeZone === 'Z') {
    return '+0000';
  }

  const offsetMatch = OFFSET_PATTERN.exec(timeZone);
  if (offsetMatch) {
    return formatFixedOffset(timeZone, offsetMatch);
  }

  const instant: Instant = { kind: 'instant', epochMilliseconds };
  const offsetMinutes = timeZoneDatabase.getOffsetMinutes(instant, timeZone);
  const sign = offsetMinutes < 0 ? '-' : '+';
  const absoluteMinutes = Math.abs(offsetMinutes);
  const hours = padLeft(
    Math.floor(absoluteMinutes / MINUTES_PER_HOUR).toString(),
    OFFSET_COMPONENT_WIDTH,
  );
  const minutes = padLeft(
    (absoluteMinutes % MINUTES_PER_HOUR).toString(),
    OFFSET_COMPONENT_WIDTH,
  );
  return `${sign}${hours}${minutes}`;
}

function formatFixedOffset(timeZone: string, match: RegExpExecArray): string {
  const groups = match.groups as Record<string, string>;
  const { sign, hours: hourText, minutes: minuteText } = groups;
  const hours = Number(hourText);
  const minutes = Number(minuteText);
  if (hours > MAX_OFFSET_HOURS || minutes > MAX_OFFSET_MINUTES) {
    throw new RangeError(`Invalid fixed time-zone offset: ${timeZone}`);
  }
  return `${sign}${hourText}${minuteText}`;
}
