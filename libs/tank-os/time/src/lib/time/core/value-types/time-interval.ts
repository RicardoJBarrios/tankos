import { Instant } from './time-types';

/** A closed interval on the UTC timeline. */
export type TimeInterval = Readonly<{
  /** Inclusive interval start. */
  start: Instant;
  /** Inclusive interval end. */
  end: Instant;
}>;
