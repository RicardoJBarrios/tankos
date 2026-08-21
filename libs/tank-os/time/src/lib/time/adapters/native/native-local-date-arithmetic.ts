import { CalendarPeriod, LocalDate, LocalDateInput } from '../../core';
import { isValidCalendarDate } from '../../core/validation';
import { nativeParseLocalDate } from './native-local-date-parsing';

/** Adds whole calendar years, months and days to a local date. */
export function nativeAddLocalDate(
  value: LocalDateInput,
  period: CalendarPeriod,
): LocalDate {
  const date = nativeParseLocalDate(value);
  validatePeriod(period);
  const years = period.years ?? 0;
  const months = period.months ?? 0;
  const days = period.days ?? 0;
  const targetMonthIndex = date.month - 1 + months;
  const targetYear = date.year + years + Math.floor(targetMonthIndex / 12);
  const targetMonth = ((targetMonthIndex % 12) + 12) % 12;
  const targetDay = Math.min(
    date.day,
    daysInMonth(targetYear, targetMonth + 1),
  );
  const result = new Date(0);
  result.setUTCFullYear(targetYear, targetMonth, targetDay);
  result.setUTCHours(0, 0, 0, 0);
  result.setUTCDate(result.getUTCDate() + days);
  const normalized = {
    kind: 'local-date' as const,
    year: result.getUTCFullYear(),
    month: result.getUTCMonth() + 1,
    day: result.getUTCDate(),
  };
  if (!isValidCalendarDate(normalized.year, normalized.month, normalized.day)) {
    throw new RangeError('Calendar period exceeds supported date range');
  }
  return normalized;
}

function validatePeriod(period: CalendarPeriod): void {
  if (period === null || typeof period !== 'object') {
    throw new RangeError('Invalid calendar period');
  }
  for (const value of [period.years, period.months, period.days]) {
    if (
      value !== undefined &&
      (!Number.isSafeInteger(value) || !Number.isFinite(value))
    ) {
      throw new RangeError('Calendar period values must be safe integers');
    }
  }
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28;
  }
  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}
