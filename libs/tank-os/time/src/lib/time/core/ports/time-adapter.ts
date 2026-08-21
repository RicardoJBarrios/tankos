import {
  Instant,
  InstantInput,
  LocalDate,
  LocalDateInput,
  Duration,
  DurationInput,
  ZonedDateTimeResolution,
} from '../value-types';

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
  /** Resolves a local date-time with an explicit numeric offset. */
  resolveOffsetDateTime(
    value: string,
    offsetMinutes: number,
  ): ZonedDateTimeResolution;
  isValidTimeZone(timeZone: string): boolean;
}
