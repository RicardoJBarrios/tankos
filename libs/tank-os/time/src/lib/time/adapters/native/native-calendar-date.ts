import { DateTimeParts } from '../../ports';

/**
 * Builds a UTC timestamp from complete calendar fields without consulting
 * local time.
 *
 * @param parts - Complete calendar and clock fields.
 * @returns Epoch milliseconds for the supplied UTC fields.
 */
export function createUtcTimestamp(parts: DateTimeParts): number {
  const date = new Date(0);
  date.setUTCFullYear(parts.year, parts.month - 1, parts.day);
  date.setUTCHours(parts.hour, parts.minute, parts.second, parts.millisecond);
  return date.getTime();
}

/**
 * Validates a proleptic Gregorian calendar date.
 *
 * @param year - Four-digit calendar year.
 * @param month - Calendar month from 1 through 12.
 * @param day - Calendar day.
 * @returns `true` when the fields form an actual calendar date.
 */
export function isValidCalendarDate(
  year: number,
  month: number,
  day: number,
): boolean {
  if (
    !Number.isInteger(year) ||
    year < 1 ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12 ||
    !Number.isInteger(day) ||
    day < 1 ||
    day > 31
  ) {
    return false;
  }

  const timestamp = createUtcTimestamp({
    year,
    month,
    day,
    hour: 0,
    minute: 0,
    second: 0,
    millisecond: 0,
  });
  const date = new Date(timestamp);

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}
