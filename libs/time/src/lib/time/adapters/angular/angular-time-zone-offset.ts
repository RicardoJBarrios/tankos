import { padLeft } from '@tankos/formatting';
import { Instant, TimeZoneDatabasePort } from '../../core';

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

  const offsetMatch = /^([+-])(\d{2}):?(\d{2})$/.exec(timeZone);
  if (offsetMatch) {
    const hours = Number(offsetMatch[2]);
    const minutes = Number(offsetMatch[3]);
    if (hours > 23 || minutes > 59) {
      throw new RangeError(`Invalid fixed time-zone offset: ${timeZone}`);
    }
    return `${offsetMatch[1]}${offsetMatch[2]}${offsetMatch[3]}`;
  }

  const instant: Instant = { kind: 'instant', epochMilliseconds };
  const offsetMinutes = timeZoneDatabase.getOffsetMinutes(instant, timeZone);
  const sign = offsetMinutes < 0 ? '-' : '+';
  const absoluteMinutes = Math.abs(offsetMinutes);
  const hours = padLeft(Math.floor(absoluteMinutes / 60).toString(), 2);
  const minutes = padLeft((absoluteMinutes % 60).toString(), 2);
  return `${sign}${hours}${minutes}`;
}
