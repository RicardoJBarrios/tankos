import { isValidCalendarDate } from './native-calendar-date';
import { DateTimeParts } from '../../ports';

const LOCAL_DATE_TIME_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(\.\d{1,3}|))?$/;

/**
 * Parses the local date-time portion used by the native time-zone adapter.
 *
 * @param value - A local ISO date-time without a zone designator.
 * @returns The structured local date-time parts.
 * @throws `RangeError` when the input is malformed or invalid.
 */
export function parseLocalDateTime(value: string): DateTimeParts {
  const match = LOCAL_DATE_TIME_PATTERN.exec(value);
  if (!match) {
    throw new RangeError(
      'A local date-time must use YYYY-MM-DDTHH:mm[:ss[.SSS]] syntax without a time zone',
    );
  }

  const [, year, month, day, hour, minute, second, fraction] = match;
  const parts: DateTimeParts = {
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
    second: second ? Number(second) : 0,
    millisecond: fraction ? Number(fraction.slice(1).padEnd(3, '0')) : 0,
  };

  if (
    !isValidCalendarDate(parts.year, parts.month, parts.day) ||
    parts.hour > 23 ||
    parts.minute > 59 ||
    parts.second > 59
  ) {
    throw new RangeError(`Invalid local date-time: ${value}`);
  }

  return parts;
}
