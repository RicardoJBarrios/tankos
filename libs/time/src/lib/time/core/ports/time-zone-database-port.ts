import { Instant } from '../value-types';

/** Replaceable source of IANA time-zone rules used by temporal adapters. */
export interface TimeZoneDatabasePort {
  /** Returns whether the identifier is recognized by the configured database. */
  isValid(timeZone: string): boolean;
  /** Resolves a local date-time using the configured zone rules. */
  resolveLocalDateTime(value: string, timeZone: string): Instant;
  /** Returns the offset in minutes applicable at an instant. */
  getOffsetMinutes(instant: Instant, timeZone: string): number;
}
