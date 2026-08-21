import { Duration, DurationInput } from '../../core';

/** Returns whether a duration input is a normalized safe millisecond value. */
export function nativeIsValidDuration(value: unknown): value is DurationInput {
  if (typeof value === 'number') {
    return Number.isSafeInteger(Math.trunc(value));
  }

  if (typeof value === 'string') {
    return (
      /^[-+]?P(?=\d|.*T\d)(?:(?:\d+)D)?(?:T(?:(?:\d+)H)?(?:(?:\d+)M)?(?:(?:\d+)(?:\.\d+)?S)?)?$/.test(
        value,
      ) &&
      (!value.includes('T') || /[HMS]/.test(value))
    );
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
