import { ComparisonResult, DurationInput } from '../../core';
import { nativeParseDuration } from './native-duration-parsing';

/** Compares two normalized elapsed durations. */
export function nativeCompareDurations(
  left: DurationInput,
  right: DurationInput,
): ComparisonResult {
  const leftMilliseconds = nativeParseDuration(left).milliseconds;
  const rightMilliseconds = nativeParseDuration(right).milliseconds;
  if (leftMilliseconds < rightMilliseconds) return -1;
  if (leftMilliseconds > rightMilliseconds) return 1;
  return 0;
}
