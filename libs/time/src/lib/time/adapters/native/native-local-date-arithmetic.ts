import { CalendarPeriod, LocalDate, LocalDateInput } from '../../core';
import { isValidCalendarDate } from '../../core/validation';
import { nativeParseLocalDate } from './native-local-date-parsing';

const MONTHS_PER_YEAR = 12;
const FEBRUARY = 2;
const THIRTY_DAY_MONTHS = [4, 6, 9, 11];
const DAYS_IN_THIRTY_DAY_MONTH = 30;
const DAYS_IN_LONG_MONTH = 31;
const FEBRUARY_LEAP_DAYS = 29;
const FEBRUARY_COMMON_DAYS = 28;
const LEAP_YEAR_CYCLE = 4;
const CENTURY_CYCLE = 100;
const FOUR_CENTURY_CYCLE = 400;

/** Adds whole calendar years, months and days to a local date. */
export function nativeAddLocalDate(
  value: LocalDateInput,
  period: CalendarPeriod | null,
): LocalDate {
  const date = nativeParseLocalDate(value);
  validatePeriod(period);
  const years = period.years ?? 0;
  const months = period.months ?? 0;
  const days = period.days ?? 0;
  const targetMonthIndex = date.month - 1 + months;
  const targetYear =
    date.year + years + Math.floor(targetMonthIndex / MONTHS_PER_YEAR);
  const targetMonth =
    ((targetMonthIndex % MONTHS_PER_YEAR) + MONTHS_PER_YEAR) % MONTHS_PER_YEAR;
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

function validatePeriod(period: CalendarPeriod | null): void {
  if (period === null || typeof period !== 'object') {
    throw new RangeError('Invalid calendar period');
  }
  for (const value of [period.years, period.months, period.days]) {
    if (value !== undefined && !isValidPeriodValue(value)) {
      throw new RangeError('Calendar period values must be safe integers');
    }
  }
}

function isValidPeriodValue(value: number): boolean {
  return Number.isSafeInteger(value);
}

function daysInMonth(year: number, month: number): number {
  if (month === FEBRUARY) return daysInFebruary(year);
  return THIRTY_DAY_MONTHS.includes(month)
    ? DAYS_IN_THIRTY_DAY_MONTH
    : DAYS_IN_LONG_MONTH;
}

function daysInFebruary(year: number): number {
  return isLeapYear(year) ? FEBRUARY_LEAP_DAYS : FEBRUARY_COMMON_DAYS;
}

function isLeapYear(year: number): boolean {
  if (year % LEAP_YEAR_CYCLE !== 0) return false;
  if (year % CENTURY_CYCLE === 0) return year % FOUR_CENTURY_CYCLE === 0;
  return true;
}
