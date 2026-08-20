import { Instant, InstantInput, LocalDate } from './time-types';

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
  parseLocalDate(value: string): LocalDate;
  isValidLocalDate(value: unknown): value is string;
  fromZonedDateTime(value: string, timeZone: string): Instant;
  isValidTimeZone(timeZone: string): boolean;
}
