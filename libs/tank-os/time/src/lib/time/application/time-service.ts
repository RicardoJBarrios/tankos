import { inject, Injectable } from '@angular/core';
import { TIME_CLOCK, TIME_PORT } from './time-tokens';
import {
  Duration,
  DurationInput,
  CalendarPeriod,
  ComparisonResult,
  Instant,
  InstantInput,
  LocalDate,
  LocalDateInput,
  ZonedDateTimeResolution,
  TimeInterval,
} from '../core';

@Injectable({ providedIn: 'root' })
/** Facade exposing the active adapter through Angular DI. */
export class TimeService {
  readonly #time = inject(TIME_PORT);
  readonly #clock = inject(TIME_CLOCK);

  /** Returns the current instant from the configured clock. */
  now(): Instant {
    return this.#clock.now();
  }

  /** Parses an instant through the configured adapter. */
  parseInstant(value: InstantInput): Instant {
    return this.#time.parseInstant(value);
  }

  /** Validates an instant through the configured adapter. */
  isValidInstant(value: unknown): value is InstantInput {
    return this.#time.isValidInstant(value);
  }

  /** Serializes an instant as UTC through the configured adapter. */
  toUtcIsoString(value: InstantInput): string {
    return this.#time.toUtcIsoString(value);
  }

  /** Parses an elapsed duration through the configured adapter. */
  parseDuration(value: DurationInput): Duration {
    return this.#time.parseDuration(value);
  }

  /** Validates an elapsed duration through the configured adapter. */
  isValidDuration(value: unknown): value is DurationInput {
    return this.#time.isValidDuration(value);
  }

  /** Serializes an elapsed duration as canonical ISO 8601. */
  toDurationIsoString(value: DurationInput): string {
    return this.#time.toDurationIsoString(value);
  }

  /** Calculates elapsed time from one instant to another. */
  durationBetween(start: InstantInput, end: InstantInput): Duration {
    return this.#time.durationBetween(start, end);
  }

  /** Adds elapsed time to an instant. */
  addDuration(start: InstantInput, duration: DurationInput): Instant {
    return this.#time.addDuration(start, duration);
  }

  /** Compares two instants using three-way ordering. */
  compareInstants(left: InstantInput, right: InstantInput): ComparisonResult {
    return this.#time.compareInstants(left, right);
  }

  /** Compares two durations using three-way ordering. */
  compareDurations(
    left: DurationInput,
    right: DurationInput,
  ): ComparisonResult {
    return this.#time.compareDurations(left, right);
  }

  /** Creates a closed interval on the UTC timeline. */
  createInterval(start: InstantInput, end: InstantInput): TimeInterval {
    return this.#time.createInterval(start, end);
  }

  /** Checks whether an instant is within a closed interval. */
  contains(interval: TimeInterval, value: InstantInput): boolean {
    return this.#time.contains(interval, value);
  }

  /** Clamps an instant to a closed interval. */
  clamp(value: InstantInput, interval: TimeInterval): Instant {
    return this.#time.clamp(value, interval);
  }

  /** Adds a calendar period to a time-zone-independent date. */
  addLocalDate(value: LocalDateInput, period: CalendarPeriod): LocalDate {
    return this.#time.addLocalDate(value, period);
  }

  /** Calculates whole calendar-day distance as a duration. */
  durationBetweenLocalDates(
    start: LocalDateInput,
    end: LocalDateInput,
  ): Duration {
    return this.#time.durationBetweenLocalDates(start, end);
  }

  /** Parses a time-zone-independent calendar date. */
  parseLocalDate(value: LocalDateInput): LocalDate {
    return this.#time.parseLocalDate(value);
  }

  /** Validates a time-zone-independent calendar date. */
  isValidLocalDate(value: unknown): value is LocalDateInput {
    return this.#time.isValidLocalDate(value);
  }

  /** Resolves a local date-time in an explicit zone. */
  fromZonedDateTime(value: string, timeZone: string): Instant {
    return this.#time.fromZonedDateTime(value, timeZone);
  }

  /** Resolves a local date-time and retains its original zone metadata. */
  resolveZonedDateTime(
    value: string,
    timeZone: string,
  ): ZonedDateTimeResolution {
    return this.#time.resolveZonedDateTime(value, timeZone);
  }

  /** Resolves a local date-time with an explicit numeric offset. */
  resolveOffsetDateTime(
    value: string,
    offsetMinutes: number,
  ): ZonedDateTimeResolution {
    return this.#time.resolveOffsetDateTime(value, offsetMinutes);
  }

  /** Validates an IANA time-zone identifier. */
  isValidTimeZone(timeZone: string): boolean {
    return this.#time.isValidTimeZone(timeZone);
  }
}
