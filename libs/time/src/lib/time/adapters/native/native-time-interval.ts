import { InstantInput, TimeInterval } from '../../core';
import { nativeParseInstant } from './native-instant-parsing';
import { nativeCompareInstants } from './native-instant-comparison';

/** Creates a closed interval on the normalized UTC timeline. */
export function nativeCreateInterval(
  start: InstantInput,
  end: InstantInput,
): TimeInterval {
  return normalizeInterval({
    start: nativeParseInstant(start),
    end: nativeParseInstant(end),
  });
}

/** Checks membership in a closed interval, including both boundaries. */
export function nativeContains(
  interval: TimeInterval,
  value: InstantInput,
): boolean {
  const normalizedInterval = normalizeInterval(interval);
  const instant = nativeParseInstant(value);
  return (
    nativeCompareInstants(normalizedInterval.start, instant) <= 0 &&
    nativeCompareInstants(instant, normalizedInterval.end) <= 0
  );
}

/** Clamps an instant to the nearest boundary of a closed interval. */
export function nativeClamp(
  value: InstantInput,
  interval: TimeInterval,
): ReturnType<typeof nativeParseInstant> {
  const normalizedInterval = normalizeInterval(interval);
  const instant = nativeParseInstant(value);
  if (nativeCompareInstants(instant, normalizedInterval.start) < 0) {
    return normalizedInterval.start;
  }
  if (nativeCompareInstants(instant, normalizedInterval.end) > 0) {
    return normalizedInterval.end;
  }
  return instant;
}

function normalizeInterval(interval: TimeInterval | null): TimeInterval {
  if (!isValidIntervalShape(interval)) {
    throw new RangeError('Invalid time interval');
  }

  const normalized = {
    start: nativeParseInstant(interval.start),
    end: nativeParseInstant(interval.end),
  };
  if (nativeCompareInstants(normalized.start, normalized.end) > 0) {
    throw new RangeError('An interval cannot end before it starts');
  }
  return normalized;
}

function isValidIntervalShape(
  interval: TimeInterval | null,
): interval is TimeInterval {
  return (
    interval !== null &&
    typeof interval === 'object' &&
    'start' in interval &&
    'end' in interval
  );
}
