import { inject, Injectable } from '@angular/core';
import { TIME_CLOCK, TIME_PORT } from './time-tokens';
import {
  Duration,
  DurationInput,
  Instant,
  InstantInput,
  LocalDate,
  LocalDateInput,
  ZonedDateTimeResolution,
} from '../core';

@Injectable({ providedIn: 'root' })
/** Facade exposing the active adapter through Angular DI. */
export class TimeService {
  readonly #time = inject(TIME_PORT);
  readonly #clock = inject(TIME_CLOCK);

  /** Returns the current instant from the configured clock. */
  public now(): Instant {
    return this.#clock.now();
  }

  /** Parses an instant through the configured adapter. */
  public parseInstant(value: InstantInput): Instant {
    return this.#time.parseInstant(value);
  }

  /** Validates an instant through the configured adapter. */
  public isValidInstant(value: unknown): value is InstantInput {
    return this.#time.isValidInstant(value);
  }

  /** Serializes an instant as UTC through the configured adapter. */
  public toUtcIsoString(value: InstantInput): string {
    return this.#time.toUtcIsoString(value);
  }

  /** Parses an elapsed duration through the configured adapter. */
  public parseDuration(value: DurationInput): Duration {
    return this.#time.parseDuration(value);
  }

  /** Validates an elapsed duration through the configured adapter. */
  public isValidDuration(value: unknown): value is DurationInput {
    return this.#time.isValidDuration(value);
  }

  /** Serializes an elapsed duration as canonical ISO 8601. */
  public toDurationIsoString(value: DurationInput): string {
    return this.#time.toDurationIsoString(value);
  }

  /** Parses a time-zone-independent calendar date. */
  public parseLocalDate(value: LocalDateInput): LocalDate {
    return this.#time.parseLocalDate(value);
  }

  /** Validates a time-zone-independent calendar date. */
  public isValidLocalDate(value: unknown): value is LocalDateInput {
    return this.#time.isValidLocalDate(value);
  }

  /** Resolves a local date-time in an explicit zone. */
  public fromZonedDateTime(value: string, timeZone: string): Instant {
    return this.#time.fromZonedDateTime(value, timeZone);
  }

  /** Resolves a local date-time and retains its original zone metadata. */
  public resolveZonedDateTime(
    value: string,
    timeZone: string,
  ): ZonedDateTimeResolution {
    return this.#time.resolveZonedDateTime(value, timeZone);
  }

  /** Resolves a local date-time with an explicit numeric offset. */
  public resolveOffsetDateTime(
    value: string,
    offsetMinutes: number,
  ): ZonedDateTimeResolution {
    return this.#time.resolveOffsetDateTime(value, offsetMinutes);
  }

  /** Validates an IANA time-zone identifier. */
  public isValidTimeZone(timeZone: string): boolean {
    return this.#time.isValidTimeZone(timeZone);
  }
}
