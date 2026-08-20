import { isValidCalendarDate } from './native-calendar-date';
import { LocalDate } from '../../ports/time-types';

const LOCAL_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Parses a calendar date without applying a time-zone conversion.
 *
 * @param value - A `YYYY-MM-DD` calendar date.
 * @returns The structured local date.
 * @throws `RangeError` when the input is not a valid calendar date.
 */
export function nativeParseLocalDate(value: string): LocalDate {
  const match = LOCAL_DATE_PATTERN.exec(value);
  if (!match) {
    throw new RangeError('A local date must use YYYY-MM-DD syntax');
  }

  const [, year, month, day] = match;
  const parsed = {
    kind: 'local-date' as const,
    year: Number(year),
    month: Number(month),
    day: Number(day),
  };

  if (!isValidCalendarDate(parsed.year, parsed.month, parsed.day)) {
    throw new RangeError(`Invalid local date: ${value}`);
  }

  return parsed;
}
