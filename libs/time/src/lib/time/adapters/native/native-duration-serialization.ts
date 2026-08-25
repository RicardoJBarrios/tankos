import { padLeft, trimTrailingZeros } from '@tankos/formatting';
import { DurationInput } from '../../core';
import { nativeParseDuration } from './native-duration-parsing';

const MILLISECONDS_PER_SECOND = 1_000;
const MILLISECONDS_PER_MINUTE = 60 * MILLISECONDS_PER_SECOND;
const MILLISECONDS_PER_HOUR = 60 * MILLISECONDS_PER_MINUTE;
const MILLISECONDS_PER_DAY = 24 * MILLISECONDS_PER_HOUR;
const FRACTION_DIGITS = 3;

/** Serializes a duration as canonical fixed-unit ISO 8601. */
export function nativeToDurationIsoString(value: DurationInput): string {
  const milliseconds = nativeParseDuration(value).milliseconds;
  const sign = milliseconds < 0 ? '-' : '';
  let remainder = Math.abs(milliseconds);
  const days = Math.floor(remainder / MILLISECONDS_PER_DAY);
  remainder %= MILLISECONDS_PER_DAY;
  const hours = Math.floor(remainder / MILLISECONDS_PER_HOUR);
  remainder %= MILLISECONDS_PER_HOUR;
  const minutes = Math.floor(remainder / MILLISECONDS_PER_MINUTE);
  remainder %= MILLISECONDS_PER_MINUTE;
  const seconds = Math.floor(remainder / MILLISECONDS_PER_SECOND);
  const millis = remainder % MILLISECONDS_PER_SECOND;
  const datePart = days > 0 ? `${String(days)}D` : '';
  const timePart =
    days > 0 && isZeroTime(hours, minutes, seconds, millis)
      ? ''
      : formatTimePart(hours, minutes, seconds, millis);

  return `${sign}P${datePart}${timePart}`;
}

function formatTimePart(
  hours: number,
  minutes: number,
  seconds: number,
  milliseconds: number,
): string {
  if (isZeroTime(hours, minutes, seconds, milliseconds)) {
    return 'T0S';
  }

  const timeParts: string[] = [];
  if (hours > 0) {
    timeParts.push(`${String(hours)}H`);
  }
  if (minutes > 0) {
    timeParts.push(`${String(minutes)}M`);
  }
  if (seconds > 0 || milliseconds > 0) {
    const fractionalSeconds = formatFractionalSeconds(milliseconds);
    timeParts.push(`${String(seconds)}${fractionalSeconds}S`);
  }
  return `T${timeParts.join('')}`;
}

function formatFractionalSeconds(milliseconds: number): string {
  if (milliseconds === 0) return '';
  return `.${trimTrailingZeros(padLeft(milliseconds.toString(), FRACTION_DIGITS))}`;
}

function isZeroTime(
  hours: number,
  minutes: number,
  seconds: number,
  milliseconds: number,
): boolean {
  return hours === 0 && minutes === 0 && seconds === 0 && milliseconds === 0;
}
