import { isValidCalendarDate } from '../../core/validation';
import { LocalDate, LocalDateInput } from '../../core';

const LOCAL_DATE_PATTERN = /^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})$/u;

function parseStructuredLocalDate(value: unknown): LocalDate | undefined {
  if (!isStructuredLocalDate(value)) return undefined;
  const candidate = value as { year?: unknown; month?: unknown; day?: unknown };
  if (
    !hasNumericDateFields(candidate) ||
    !isValidCalendarDate(candidate.year, candidate.month, candidate.day)
  ) {
    throw new RangeError('Invalid local date');
  }
  return {
    kind: 'local-date',
    year: candidate.year,
    month: candidate.month,
    day: candidate.day,
  };
}

function hasNumericDateFields(candidate: {
  year?: unknown;
  month?: unknown;
  day?: unknown;
}): candidate is { year: number; month: number; day: number } {
  return (
    typeof candidate.year === 'number' &&
    typeof candidate.month === 'number' &&
    typeof candidate.day === 'number'
  );
}

function isStructuredLocalDate(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    (value as { kind?: unknown }).kind === 'local-date'
  );
}

function parseLocalDateString(value: string): LocalDate {
  const match = LOCAL_DATE_PATTERN.exec(value);
  if (!match) throw new RangeError('A local date must use YYYY-MM-DD syntax');
  const groups = match.groups as Record<string, string>;
  const { year, month, day } = groups;
  const parsed = {
    kind: 'local-date' as const,
    year: Number(year),
    month: Number(month),
    day: Number(day),
  };
  if (!isValidCalendarDate(parsed.year, parsed.month, parsed.day))
    throw new RangeError(`Invalid local date: ${value}`);
  return parsed;
}

/**
 * Parses a calendar date without applying a time-zone conversion.
 *
 * @param value - A `YYYY-MM-DD` calendar date.
 * @returns The structured local date.
 * @throws `RangeError` when the input is not a valid calendar date.
 */
export function nativeParseLocalDate(value: LocalDateInput): LocalDate {
  if (typeof value === 'string') return parseLocalDateString(value);
  const parsed = parseStructuredLocalDate(value);
  if (!parsed) throw new RangeError('Invalid local date');
  return parsed;
}
