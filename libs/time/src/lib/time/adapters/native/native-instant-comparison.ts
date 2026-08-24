import { ComparisonResult, InstantInput } from '../../core';
import { nativeParseInstant } from './native-instant-parsing';

/** Compares two normalized instants. */
export function nativeCompareInstants(
  left: InstantInput,
  right: InstantInput,
): ComparisonResult {
  const leftMilliseconds = nativeParseInstant(left).epochMilliseconds;
  const rightMilliseconds = nativeParseInstant(right).epochMilliseconds;
  return leftMilliseconds < rightMilliseconds
    ? -1
    : leftMilliseconds > rightMilliseconds
      ? 1
      : 0;
}
