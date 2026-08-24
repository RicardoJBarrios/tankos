import { Duration, InstantInput } from '../../core';
import { truncateMilliseconds } from '../../core/validation';
import { nativeParseInstant } from './native-instant-parsing';

/** Calculates elapsed milliseconds from the first instant to the second. */
export function nativeDurationBetween(
  start: InstantInput,
  end: InstantInput,
): Duration {
  const startMilliseconds = nativeParseInstant(start).epochMilliseconds;
  const endMilliseconds = nativeParseInstant(end).epochMilliseconds;
  return {
    kind: 'duration',
    milliseconds: truncateMilliseconds(endMilliseconds - startMilliseconds),
  };
}
