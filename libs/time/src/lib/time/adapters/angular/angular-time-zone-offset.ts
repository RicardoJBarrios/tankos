import { padLeft } from '@tankos/formatting';
import { Instant, TimeZoneDatabasePort } from '../../core';

const OFFSET_PATTERN = /^(?<sign>[+-])(?<hours>\d{2}):?(?<minutes>\d{2})$/u;

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
    const groups = offsetMatch.groups as Record<string, string>;
    const { sign, hours: hourText, minutes: minuteText } = groups;
    const hours = Number(hourText);
    const minutes = Number(minuteText);
    if (hours > 23 || minutes > 59) {
      throw new RangeError(`Invalid fixed time-zone offset: ${timeZone}`);
    }
    return `${sign}${hourText}${minuteText}`;
  }

  const instant: Instant = { kind: 'instant', epochMilliseconds };
  const offsetMinutes = timeZoneDatabase.getOffsetMinutes(instant, timeZone);
  const sign = offsetMinutes < 0 ? '-' : '+';
  const absoluteMinutes = Math.abs(offsetMinutes);
  const hours = padLeft(Math.floor(absoluteMinutes / 60).toString(), 2);
  const minutes = padLeft((absoluteMinutes % 60).toString(), 2);
  return `${sign}${hours}${minutes}`;
}
