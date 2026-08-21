import { ComparisonResult, DurationInput, InstantInput } from '../../core';
import { nativeParseDuration } from './native-duration-parsing';
import { nativeParseInstant } from './native-instant-parsing';

/** Compares two normalized instants. */
export function nativeCompareInstants(
  left: InstantInput,
  right: InstantInput,
): ComparisonResult {
  return compare(
    nativeParseInstant(left).epochMilliseconds,
    nativeParseInstant(right).epochMilliseconds,
  );
}

/** Compares two normalized elapsed durations. */
export function nativeCompareDurations(
  left: DurationInput,
  right: DurationInput,
): ComparisonResult {
  return compare(
    nativeParseDuration(left).milliseconds,
    nativeParseDuration(right).milliseconds,
  );
}

function compare(left: number, right: number): ComparisonResult {
  return left < right ? -1 : left > right ? 1 : 0;
}
