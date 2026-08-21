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
