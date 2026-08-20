/**
 * Converts a time zone identifier into the numeric offset accepted by
 * Angular's `DatePipe` for a particular instant.
 *
 * @param timeZone - An IANA identifier, UTC, or an explicit numeric offset.
 * @param epochMilliseconds - The instant at which the offset is required.
 * @returns A `DatePipe`-compatible offset such as `+0100`.
 */
export function toDatePipeTimeZone(
  timeZone: string,
  epochMilliseconds: number,
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

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(epochMilliseconds));
  const values = Object.fromEntries(
    parts
      .filter(({ type }) => type !== 'literal')
      .map(({ type, value }) => [type, Number(value)]),
  ) as Record<string, number>;
  const localAsUtc = Date.UTC(
    values['year'],
    values['month'] - 1,
    values['day'],
    values['hour'],
    values['minute'],
    values['second'],
  );
  const offsetMinutes = Math.round((localAsUtc - epochMilliseconds) / 60000);
  const sign = offsetMinutes < 0 ? '-' : '+';
  const absoluteMinutes = Math.abs(offsetMinutes);
  const hours = Math.floor(absoluteMinutes / 60)
    .toString()
    .padStart(2, '0');
  const minutes = (absoluteMinutes % 60).toString().padStart(2, '0');
  return `${sign}${hours}${minutes}`;
}
