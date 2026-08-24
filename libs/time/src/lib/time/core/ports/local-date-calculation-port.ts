import {
  CalendarPeriod,
  Duration,
  LocalDate,
  LocalDateInput,
} from '../value-types';

/** Port for calendar arithmetic that does not apply a time zone. */
export interface LocalDateCalculationPort {
  /** Adds a calendar period without applying a time zone. */
  addLocalDate(value: LocalDateInput, period: CalendarPeriod): LocalDate;
  /** Returns calendar-day distance as a whole-day duration. */
  durationBetweenLocalDates(
    start: LocalDateInput,
    end: LocalDateInput,
  ): Duration;
}
