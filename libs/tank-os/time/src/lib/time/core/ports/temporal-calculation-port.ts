import {
  CalendarPeriod,
  ComparisonResult,
  Duration,
  DurationInput,
  Instant,
  InstantInput,
  LocalDate,
  LocalDateInput,
  TimeInterval,
} from '../value-types';

/** Port for deterministic calculations over normalized temporal values. */
export interface TemporalCalculationPort {
  /** Returns the elapsed duration from `start` to `end`. */
  durationBetween(start: InstantInput, end: InstantInput): Duration;
  /** Adds an elapsed duration to an instant. */
  addDuration(start: InstantInput, duration: DurationInput): Instant;
  /** Compares two instants using three-way ordering. */
  compareInstants(left: InstantInput, right: InstantInput): ComparisonResult;
  /** Compares two elapsed durations using three-way ordering. */
  compareDurations(left: DurationInput, right: DurationInput): ComparisonResult;
  /** Creates a closed interval and rejects an inverted range. */
  createInterval(start: InstantInput, end: InstantInput): TimeInterval;
  /** Returns whether an instant belongs to a closed interval. */
  contains(interval: TimeInterval, value: InstantInput): boolean;
  /** Limits an instant to the closed interval boundaries. */
  clamp(value: InstantInput, interval: TimeInterval): Instant;
  /** Adds a calendar period without applying a time zone. */
  addLocalDate(value: LocalDateInput, period: CalendarPeriod): LocalDate;
  /** Returns calendar-day distance as a whole-day duration. */
  durationBetweenLocalDates(
    start: LocalDateInput,
    end: LocalDateInput,
  ): Duration;
}
