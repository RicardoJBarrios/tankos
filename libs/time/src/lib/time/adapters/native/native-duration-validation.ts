import { Duration, DurationInput } from '../../core';
import { nativeParseDuration } from './native-duration-parsing';

/** Returns whether a duration input is a normalized safe millisecond value. */
export function nativeIsValidDuration(value: unknown): value is DurationInput {
  if (typeof value === 'number') {
    return Number.isSafeInteger(Math.trunc(value));
  }

  if (typeof value === 'string') {
    try {
      nativeParseDuration(value);
      return true;
    } catch {
      return false;
    }
  }

  if (
    typeof value !== 'object' ||
    value === null ||
    (value as Partial<Duration>).kind !== 'duration'
  ) {
    return false;
  }

  const milliseconds = (value as Partial<Duration>).milliseconds;
  return (
    typeof milliseconds === 'number' &&
    Number.isSafeInteger(Math.trunc(milliseconds))
  );
}
