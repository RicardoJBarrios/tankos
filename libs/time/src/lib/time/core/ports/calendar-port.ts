import { LocalDate, LocalDateInput } from '../value-types';

/** Port for time-zone-independent calendar dates. */
export interface CalendarPort {
  /** Parses an accepted input into a validated calendar date. */
  parseLocalDate(value: LocalDateInput): LocalDate;
  /** Returns whether an unknown value is accepted as a calendar-date input. */
  isValidLocalDate(value: unknown): value is LocalDateInput;
}
