import {
  Instant,
  InstantInput,
  LocalDate,
  LocalDateInput,
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
  parseLocalDate(value: LocalDateInput): LocalDate;
  isValidLocalDate(value: unknown): value is LocalDateInput;
  fromZonedDateTime(value: string, timeZone: string): Instant;
  isValidTimeZone(timeZone: string): boolean;
}
