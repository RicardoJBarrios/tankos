/**
 * Validates a proleptic Gregorian calendar date without consulting a runtime
 * date implementation.
 *
 * @param year - Calendar year from 1 through 9999.
 * @param month - Calendar month from 1 through 12.
 * @param day - Calendar day within the month.
 * @returns `true` when the fields form an actual Gregorian date.
 */
export function isValidCalendarDate(
  year: number,
  month: number,
  day: number,
): boolean {
  if (!isValidCalendarDateFields(year, month, day)) return false;

  const daysInMonth = [
    DAYS_IN_LONG_MONTH,
    isLeapYear(year) ? DAYS_IN_LEAP_FEBRUARY : DAYS_IN_COMMON_FEBRUARY,
    DAYS_IN_LONG_MONTH,
    DAYS_IN_SHORT_MONTH,
    DAYS_IN_LONG_MONTH,
    DAYS_IN_SHORT_MONTH,
    DAYS_IN_LONG_MONTH,
    DAYS_IN_LONG_MONTH,
    DAYS_IN_SHORT_MONTH,
    DAYS_IN_LONG_MONTH,
    DAYS_IN_SHORT_MONTH,
    DAYS_IN_LONG_MONTH,
  ];
  return day <= daysInMonth[month - 1];
}

const DAYS_IN_LONG_MONTH = 31;
const DAYS_IN_SHORT_MONTH = 30;
const DAYS_IN_LEAP_FEBRUARY = 29;
const DAYS_IN_COMMON_FEBRUARY = 28;
const MIN_CALENDAR_VALUE = 1;
const MAX_CALENDAR_YEAR = 9999;
const MAX_CALENDAR_MONTH = 12;

function isValidCalendarDateFields(
  year: number,
  month: number,
  day: number,
): boolean {
  return isValidYear(year) && isValidMonth(month) && isValidDay(day);
}

function isValidYear(value: number): boolean {
  return (
    Number.isInteger(value) &&
    value >= MIN_CALENDAR_VALUE &&
    value <= MAX_CALENDAR_YEAR
  );
}

function isValidMonth(value: number): boolean {
  return (
    Number.isInteger(value) &&
    value >= MIN_CALENDAR_VALUE &&
    value <= MAX_CALENDAR_MONTH
  );
}

function isValidDay(value: number): boolean {
  return Number.isInteger(value) && value >= MIN_CALENDAR_VALUE;
}

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}
