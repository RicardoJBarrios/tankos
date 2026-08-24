/** Options for localized relative duration text. */
export type HumanizeDurationOptions = Readonly<{
  /** Locale used by the relative formatter. */
  locale?: string;
  /** Whether approximate month and year units may be selected. */
  calendarUnits?: 'none' | 'approximate';
}>;
