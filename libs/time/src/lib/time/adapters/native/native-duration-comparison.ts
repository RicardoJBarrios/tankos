import { ComparisonResult, DurationInput } from '../../core';
import { nativeParseDuration } from './native-duration-parsing';

/** Compares two normalized elapsed durations. */
export function nativeCompareDurations(
  left: DurationInput,
  right: DurationInput,
): ComparisonResult {
  const leftMilliseconds = nativeParseDuration(left).milliseconds;
  const rightMilliseconds = nativeParseDuration(right).milliseconds;
  return leftMilliseconds < rightMilliseconds
    ? -1
    : leftMilliseconds > rightMilliseconds
      ? 1
      : 0;
}
