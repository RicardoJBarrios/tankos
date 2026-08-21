import {
  Instant,
  InstantInput,
  LocalDate,
  LocalDateInput,
  Duration,
  DurationInput,
  ZonedDateTimeResolution,
} from '../value-types';

/** Replaceable source of IANA time-zone rules used by a temporal adapter. */
export interface TimeZoneDatabasePort {
  /** Returns whether the identifier is recognized by the configured database. */
  isValid(timeZone: string): boolean;
  /** Returns the offset in minutes applicable at an instant. */
  getOffsetMinutes(instant: Instant, timeZone: string): number;
}

/**
 * Port for the time implementation used by TankOS.
 *
 * @remarks Keeping this contract independent from `Date` allows the runtime
 * implementation to be replaced without changing domain consumers.
 */
export interface TimeAdapter {
  parseInstant(value: InstantInput): Instant;
  isValidInstant(value: unknown): value is InstantInput;
  toUtcIsoString(value: InstantInput): string;
  parseDuration(value: DurationInput): Duration;
  isValidDuration(value: unknown): value is DurationInput;
  toDurationIsoString(value: DurationInput): string;
  parseLocalDate(value: LocalDateInput): LocalDate;
  isValidLocalDate(value: unknown): value is LocalDateInput;
  fromZonedDateTime(value: string, timeZone: string): Instant;
  /** Resolves a local date-time and retains its source zone metadata. */
  resolveZonedDateTime(
    value: string,
    timeZone: string,
  ): ZonedDateTimeResolution;
  isValidTimeZone(timeZone: string): boolean;
}
