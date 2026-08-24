/**
 * Supplies the locale used by the active temporal display adapter.
 *
 * @remarks The port deliberately does not depend on Angular, Transloco or any
 * other localization implementation.
 */
export interface TimeLocalePort {
  /** Returns the currently active locale identifier. */
  getLocale(): string;
}
