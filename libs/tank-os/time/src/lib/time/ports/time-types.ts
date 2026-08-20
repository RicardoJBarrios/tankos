/** A normalized point on the UTC timeline. */
export type Instant = {
  readonly kind: 'instant';
  readonly epochMilliseconds: number;
};

/** A calendar date intentionally independent of time zones. */
export type LocalDate = {
  readonly kind: 'local-date';
  readonly year: number;
  readonly month: number;
  readonly day: number;
};

/** Accepted input forms for parsing an instant. */
export type InstantInput = Instant | number | string;

/** Date-time fields used by calendar and time-zone calculations. */
export type DateTimeParts = {
  readonly year: number;
  readonly month: number;
  readonly day: number;
  readonly hour: number;
  readonly minute: number;
  readonly second: number;
  readonly millisecond: number;
};
