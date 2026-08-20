/**
 * Validates a proleptic Gregorian calendar date without consulting a runtime
 * date implementation.
 *
 * @param year - Calendar year starting at 1.
 * @param month - Calendar month from 1 through 12.
 * @param day - Calendar day within the month.
 * @returns `true` when the fields form an actual Gregorian date.
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
    day < 1
  ) {
    return false;
  }

  const daysInMonth = [
    31,
    isLeapYear(year) ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ];
  return day <= daysInMonth[month - 1];
}

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}
