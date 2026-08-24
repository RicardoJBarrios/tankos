import { ComparisonResult, InstantInput } from '../../core';
import { nativeParseInstant } from './native-instant-parsing';

/** Compares two normalized instants. */
export function nativeCompareInstants(
  left: InstantInput,
  right: InstantInput,
): ComparisonResult {
  const leftMilliseconds = nativeParseInstant(left).epochMilliseconds;
  const rightMilliseconds = nativeParseInstant(right).epochMilliseconds;
  if (leftMilliseconds < rightMilliseconds) return -1;
  if (leftMilliseconds > rightMilliseconds) return 1;
  return 0;
}
