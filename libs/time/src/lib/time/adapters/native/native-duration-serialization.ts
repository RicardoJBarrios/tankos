import { padLeft, trimTrailingZeros } from '@tankos/formatting';
import { DurationInput } from '../../core';
import { nativeParseDuration } from './native-duration-parsing';

const MILLISECONDS_PER_SECOND = 1_000;
const MILLISECONDS_PER_MINUTE = 60 * MILLISECONDS_PER_SECOND;
const MILLISECONDS_PER_HOUR = 60 * MILLISECONDS_PER_MINUTE;
const MILLISECONDS_PER_DAY = 24 * MILLISECONDS_PER_HOUR;

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
    days > 0 && hours === 0 && minutes === 0 && seconds === 0 && millis === 0
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
  if (hours === 0 && minutes === 0 && seconds === 0 && milliseconds === 0) {
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
    const fractionalSeconds =
      milliseconds > 0
        ? `.${trimTrailingZeros(padLeft(milliseconds.toString(), 3))}`
        : '';
    timeParts.push(`${String(seconds)}${fractionalSeconds}S`);
  }
  return `T${timeParts.join('')}`;
}
