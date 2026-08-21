/** A normalized point on the UTC timeline. */
export type Instant = {
  /** Discriminator identifying a normalized timeline value. */
  readonly kind: 'instant';
  /** UTC epoch milliseconds represented by the instant. */
  readonly epochMilliseconds: number;
};

/** A calendar date intentionally independent of time zones. */
export type LocalDate = {
  /** Discriminator identifying a time-zone-independent calendar date. */
  readonly kind: 'local-date';
  /** Proleptic Gregorian year, starting at 1. */
  readonly year: number;
  /** Calendar month from 1 through 12. */
  readonly month: number;
  /** Calendar day within the month. */
  readonly day: number;
};

/** Accepted input forms for a calendar date. */
export type LocalDateInput = LocalDate | string;

/** Accepted input forms for parsing an instant. */
export type InstantInput = Instant | number | string;

/** A signed elapsed amount normalized to integer milliseconds. */
export type Duration = {
  /** Discriminator identifying a normalized duration. */
  readonly kind: 'duration';
  /** Elapsed milliseconds; negative values represent reverse elapsed time. */
  readonly milliseconds: number;
};

/** Accepted duration input forms. Strings use the supported ISO 8601 syntax. */
export type DurationInput = Duration | number | string;

/** Metadata describing how a local date-time was interpreted. */
export type TemporalOrigin = {
  /** Original IANA zone, when the source declared one. */
  readonly declaredTimeZone?: string;
  /** Original numeric offset in minutes at the resolved instant. */
  readonly declaredOffsetMinutes?: number;
};

/** Result of resolving a local date-time while retaining its source context. */
export type ZonedDateTimeResolution = {
  /** Normalized instant used by the temporal model. */
  readonly instant: Instant;
  /** Source context retained outside the instant value. */
  readonly origin: TemporalOrigin;
};

/** Date-time fields used by calendar and time-zone calculations. */
export type DateTimeParts = {
  /** Calendar year. */
  readonly year: number;
  /** Calendar month from 1 through 12. */
  readonly month: number;
  /** Calendar day within the month. */
  readonly day: number;
  /** Hour from 0 through 23. */
  readonly hour: number;
  /** Minute from 0 through 59. */
  readonly minute: number;
  /** Second from 0 through 59. */
  readonly second: number;
  /** Millisecond from 0 through 999. */
  readonly millisecond: number;
};
