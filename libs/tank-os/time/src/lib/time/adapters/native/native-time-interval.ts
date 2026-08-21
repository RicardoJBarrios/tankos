import { InstantInput, TimeInterval } from '../../core';
import { nativeParseInstant } from './native-instant-parsing';
import { nativeCompareInstants } from './native-temporal-comparison';

/** Creates a closed interval on the normalized UTC timeline. */
export function nativeCreateInterval(
  start: InstantInput,
  end: InstantInput,
): TimeInterval {
  const interval = {
    start: nativeParseInstant(start),
    end: nativeParseInstant(end),
  };
  if (nativeCompareInstants(interval.start, interval.end) > 0) {
    throw new RangeError('An interval cannot end before it starts');
  }
  return interval;
}

/** Checks membership in a closed interval, including both boundaries. */
export function nativeContains(
  interval: TimeInterval,
  value: InstantInput,
): boolean {
  const instant = nativeParseInstant(value);
  return (
    nativeCompareInstants(interval.start, instant) <= 0 &&
    nativeCompareInstants(instant, interval.end) <= 0
  );
}

/** Clamps an instant to the nearest boundary of a closed interval. */
export function nativeClamp(
  value: InstantInput,
  interval: TimeInterval,
): ReturnType<typeof nativeParseInstant> {
  const instant = nativeParseInstant(value);
  if (nativeCompareInstants(instant, interval.start) < 0) {
    return interval.start;
  }
  if (nativeCompareInstants(instant, interval.end) > 0) {
    return interval.end;
  }
  return instant;
}
