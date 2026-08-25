import { nativeParseInstant } from './native-instant-parsing';
import type { InstantInput } from '../../core';

/**
 * Checks whether a value can be parsed as an instant.
 *
 * @param value - The unknown value to validate.
 * @returns `true` when the value satisfies the instant input contract.
 */
export function nativeIsValidInstant(value: unknown): value is InstantInput {
  try {
    nativeParseInstant(value);
    return true;
  } catch {
    return false;
  }
}
