/** Supported user-facing duration representations. */
export type DurationDisplayStyle = 'iso' | 'short' | 'long' | 'digital';

/** Options used when rendering an elapsed duration. */
export type DurationDisplayOptions = Readonly<{
  /** Representation style; defaults to `short`. */
  style?: DurationDisplayStyle;
  /** Locale used by localized styles; ignored by `iso` and `digital`. */
  locale?: string;
}>;
