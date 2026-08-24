import { Instant, ZonedDateTimeResolution } from '../value-types';

/** Port for resolving local date-times against time-zone rules or offsets. */
export interface TimeZonePort {
  /** Resolves a local date-time in an IANA zone to a UTC instant. */
  fromZonedDateTime(value: string, timeZone: string): Instant;
  /** Resolves a local date-time while retaining its source-zone metadata. */
  resolveZonedDateTime(
    value: string,
    timeZone: string,
  ): ZonedDateTimeResolution;
  /** Resolves a local date-time with an explicit numeric offset. */
  resolveOffsetDateTime(
    value: string,
    offsetMinutes: number,
  ): ZonedDateTimeResolution;
  /** Returns whether an IANA time-zone identifier is recognized. */
  isValidTimeZone(timeZone: string): boolean;
}
