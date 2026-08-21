import { Instant } from '../value-types';

/** Port for obtaining the current point on the UTC timeline. */
export interface ClockPort {
  /** Returns the current instant according to the configured clock. */
  now(): Instant;
}
