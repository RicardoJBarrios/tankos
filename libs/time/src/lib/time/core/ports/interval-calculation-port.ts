import { Instant, InstantInput, TimeInterval } from '../value-types';

/** Port for closed-interval operations on the UTC timeline. */
export interface IntervalCalculationPort {
  /** Creates a closed interval and rejects an inverted range. */
  createInterval(start: InstantInput, end: InstantInput): TimeInterval;
  /** Returns whether an instant belongs to a closed interval. */
  contains(interval: TimeInterval, value: InstantInput): boolean;
  /** Limits an instant to the closed interval boundaries. */
  clamp(value: InstantInput, interval: TimeInterval): Instant;
}
