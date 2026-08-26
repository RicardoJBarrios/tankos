import { inject, Injectable } from '@angular/core';
import { TIME_PORT } from './time-tokens';
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
} from '../core';

/** Angular facade for deterministic temporal calculations. */
@Injectable({ providedIn: 'root' })
export class TemporalCalculationService {
  readonly #time = inject(TIME_PORT);

  /** Calculates elapsed time from one instant to another. */
  public durationBetween(start: InstantInput, end: InstantInput): Duration {
    return this.#time.durationBetween(start, end);
  }

  /** Adds elapsed time to an instant. */
  public addDuration(start: InstantInput, duration: DurationInput): Instant {
    return this.#time.addDuration(start, duration);
  }

  /** Compares two instants using three-way ordering. */
  public compareInstants(
    left: InstantInput,
    right: InstantInput,
  ): ComparisonResult {
    return this.#time.compareInstants(left, right);
  }

  /** Compares two durations using three-way ordering. */
  public compareDurations(
    left: DurationInput,
    right: DurationInput,
  ): ComparisonResult {
    return this.#time.compareDurations(left, right);
  }

  /** Creates a closed interval on the UTC timeline. */
  public createInterval(start: InstantInput, end: InstantInput): TimeInterval {
    return this.#time.createInterval(start, end);
  }

  /** Checks whether an instant is within a closed interval. */
  public contains(interval: TimeInterval, value: InstantInput): boolean {
    return this.#time.contains(interval, value);
  }

  /** Clamps an instant to a closed interval. */
  public clamp(value: InstantInput, interval: TimeInterval): Instant {
    return this.#time.clamp(value, interval);
  }

  /** Adds a calendar period to a time-zone-independent date. */
  public addLocalDate(
    value: LocalDateInput,
    period: CalendarPeriod,
  ): LocalDate {
    return this.#time.addLocalDate(value, period);
  }

  /** Calculates whole calendar-day distance as a duration. */
  public durationBetweenLocalDates(
    start: LocalDateInput,
    end: LocalDateInput,
  ): Duration {
    return this.#time.durationBetweenLocalDates(start, end);
  }
}
