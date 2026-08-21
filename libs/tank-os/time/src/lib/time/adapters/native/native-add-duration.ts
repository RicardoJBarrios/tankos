import { DurationInput, Instant, InstantInput } from '../../core';
import { truncateMilliseconds } from '../../core/validation';
import { nativeParseDuration } from './native-duration-parsing';
import { nativeParseInstant } from './native-instant-parsing';

/** Adds an elapsed duration to an instant without changing its time zone semantics. */
export function nativeAddDuration(
  start: InstantInput,
  duration: DurationInput,
): Instant {
  const epochMilliseconds =
    nativeParseInstant(start).epochMilliseconds +
    nativeParseDuration(duration).milliseconds;
  return {
    kind: 'instant',
    epochMilliseconds: truncateMilliseconds(epochMilliseconds),
  };
}
