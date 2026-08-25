import { ComparisonResult, InstantInput } from '../../core';
import { nativeParseInstant } from './native-instant-parsing';

const COMPARISON_LESS = -1;

/** Compares two normalized instants. */
export function nativeCompareInstants(
  left: InstantInput,
  right: InstantInput,
): ComparisonResult {
  const leftMilliseconds = nativeParseInstant(left).epochMilliseconds;
  const rightMilliseconds = nativeParseInstant(right).epochMilliseconds;
  if (leftMilliseconds < rightMilliseconds) return COMPARISON_LESS;
  if (leftMilliseconds > rightMilliseconds) return 1;
  return 0;
}
