/** A signed calendar period used to move a `LocalDate`. */
export type CalendarPeriod = Readonly<{
  /** Whole calendar years to add. */
  years?: number;
  /** Whole calendar months to add. */
  months?: number;
  /** Whole calendar days to add. */
  days?: number;
}>;
