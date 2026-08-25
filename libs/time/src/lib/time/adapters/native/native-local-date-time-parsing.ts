import { isValidCalendarDate } from '../../core/validation';
import { DateTimeParts } from '../../core';

const LOCAL_DATE_TIME_PATTERN =
  /^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})T(?<hour>\d{2}):(?<minute>\d{2})(?::(?<second>\d{2})(?<fraction>\.\d{1,3})?)?$/u;
const FRACTION_START_INDEX = 1;
const FRACTION_DIGITS = 3;
const MAX_HOUR = 23;
const MAX_MINUTE = 59;
const MAX_SECOND = 59;

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

  const groups = match.groups as Record<string, string | undefined>;
  const { year, month, day, hour, minute, second, fraction } = groups;
  const parts: DateTimeParts = {
    year: Number(year),
    month: Number(month),
    day: Number(day),
    hour: Number(hour),
    minute: Number(minute),
    second: second ? Number(second) : 0,
    millisecond: fraction
      ? Number(
          fraction.slice(FRACTION_START_INDEX).padEnd(FRACTION_DIGITS, '0'),
        )
      : 0,
  };

  if (
    !isValidCalendarDate(parts.year, parts.month, parts.day) ||
    !isValidTime(parts)
  ) {
    throw new RangeError(`Invalid local date-time: ${value}`);
  }

  return parts;
}

function isValidTime(parts: DateTimeParts): boolean {
  return (
    parts.hour <= MAX_HOUR &&
    parts.minute <= MAX_MINUTE &&
    parts.second <= MAX_SECOND
  );
}
