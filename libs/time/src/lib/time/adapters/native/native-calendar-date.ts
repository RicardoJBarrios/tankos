import { DateTimeParts } from '../../core';

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
