import { nativeParseLocalDate } from './native-local-date-parsing';

/**
 * Checks whether a value is a valid local calendar date.
 *
 * @param value - The unknown value to validate.
 * @returns `true` when the value is a valid `YYYY-MM-DD` date.
 */
export function nativeIsValidLocalDate(value: unknown): value is string {
  try {
    nativeParseLocalDate(value as string);
    return true;
  } catch {
    return false;
  }
}
