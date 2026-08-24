import { Duration, LocalDateInput } from '../../core';
import { nativeParseLocalDate } from './native-local-date-parsing';

/** Calculates whole calendar days as a duration between two local dates. */
export function nativeDurationBetweenLocalDates(
  start: LocalDateInput,
  end: LocalDateInput,
): Duration {
  const startDate = toUtcDate(nativeParseLocalDate(start));
  const endDate = toUtcDate(nativeParseLocalDate(end));
  return {
    kind: 'duration',
    milliseconds: endDate.getTime() - startDate.getTime(),
  };
}

function toUtcDate(value: ReturnType<typeof nativeParseLocalDate>): Date {
  const date = new Date(0);
  date.setUTCFullYear(value.year, value.month - 1, value.day);
  date.setUTCHours(0, 0, 0, 0);
  return date;
}
