import {
  DurationDisplayOptions,
  DurationInput,
  InstantInput,
  LocalDateInput,
} from '../value-types';

/** Options shared by time presentation operations. */
export type TimeDisplayOptions = Readonly<{
  /** Angular-compatible date format, such as `medium` or `fullDate`. */
  format?: string;
  /** Locale override passed to the final display formatter. */
  locale?: string;
  /** Explicit presentation zone; it does not alter the stored value. */
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
  formatDuration(
    value: DurationInput,
    options?: DurationDisplayOptions,
  ): string;
}
