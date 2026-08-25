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

  return isValidDurationObject(value);
}

function isValidDurationObject(value: unknown): value is Duration {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<Duration>;
  return (
    candidate.kind === 'duration' && isValidMilliseconds(candidate.milliseconds)
  );
}

function isValidMilliseconds(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(Math.trunc(value));
}
