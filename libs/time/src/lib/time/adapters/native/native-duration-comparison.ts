import { ComparisonResult, DurationInput } from '../../core';
import { nativeParseDuration } from './native-duration-parsing';

const COMPARISON_LESS = -1;

/** Compares two normalized elapsed durations. */
export function nativeCompareDurations(
  left: DurationInput,
  right: DurationInput,
): ComparisonResult {
  const leftMilliseconds = nativeParseDuration(left).milliseconds;
  const rightMilliseconds = nativeParseDuration(right).milliseconds;
  if (leftMilliseconds < rightMilliseconds) return COMPARISON_LESS;
  if (leftMilliseconds > rightMilliseconds) return 1;
  return 0;
}
