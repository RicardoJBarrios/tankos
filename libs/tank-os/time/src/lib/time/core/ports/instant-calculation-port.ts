import {
  Duration,
  DurationInput,
  Instant,
  InstantInput,
  ComparisonResult,
} from '../value-types';

/** Port for elapsed-time calculations and ordering on instants. */
export interface InstantCalculationPort {
  /** Returns the elapsed duration from `start` to `end`. */
  durationBetween(start: InstantInput, end: InstantInput): Duration;
  /** Adds an elapsed duration to an instant. */
  addDuration(start: InstantInput, duration: DurationInput): Instant;
  /** Compares two instants using three-way ordering. */
  compareInstants(left: InstantInput, right: InstantInput): ComparisonResult;
}
