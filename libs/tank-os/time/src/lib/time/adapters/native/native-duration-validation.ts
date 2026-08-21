import { Duration, DurationInput } from '../../core';

/** Returns whether a duration input is a normalized safe millisecond value. */
export function nativeIsValidDuration(value: unknown): value is DurationInput {
  if (typeof value === 'number') {
    return Number.isSafeInteger(value);
  }

  if (typeof value === 'string') {
    return (
      /^[-+]?P(?=\d|.*T\d)(?:(?:\d+)D)?(?:T(?:(?:\d+)H)?(?:(?:\d+)M)?(?:(?:\d+)(?:\.\d{1,3})?S)?)?$/.test(
        value,
      ) &&
      (!value.includes('T') || /[HMS]/.test(value))
    );
  }

  return (
    typeof value === 'object' &&
    value !== null &&
    (value as Partial<Duration>).kind === 'duration' &&
    Number.isSafeInteger((value as Partial<Duration>).milliseconds)
  );
}
