/** Supported user-facing duration representations. */
import { HumanizeDurationOptions } from './humanize-duration-options';

export type DurationDisplayStyle =
  'iso' | 'short' | 'long' | 'digital' | 'relative';

/** Options used when rendering an elapsed duration. */
export type DurationDisplayOptions = Readonly<{
  /** Representation style; defaults to `short`. */
  style?: DurationDisplayStyle;
  /** Locale used by localized styles; ignored by `iso` and `digital`. */
  locale?: string;
  /** Whether relative formatting may use approximate calendar units. */
  calendarUnits?: HumanizeDurationOptions['calendarUnits'];
}>;
