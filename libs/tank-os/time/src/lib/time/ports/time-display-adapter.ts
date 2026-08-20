import { InstantInput, LocalDateInput } from './time-types';

/** Options shared by time presentation operations. */
export type TimeDisplayOptions = Readonly<{
  /** Angular-compatible date format, such as `medium` or `fullDate`. */
  format?: string;
  locale?: string;
  timeZone?: string;
}>;

/**
 * Port for rendering temporal values for users.
 *
 * @remarks Presentation code depends on this contract rather than on a
 * concrete date-time runtime or formatting API.
 */
export interface TimeDisplayAdapter {
  formatInstant(value: InstantInput, options?: TimeDisplayOptions): string;
  formatLocalDate(value: LocalDateInput, options?: TimeDisplayOptions): string;
}
