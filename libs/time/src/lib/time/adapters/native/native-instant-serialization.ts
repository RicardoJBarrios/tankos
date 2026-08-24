import { nativeParseInstant } from './native-instant-parsing';
import { InstantInput } from '../../core';

/**
 * Serializes an instant as an ISO 8601 UTC string.
 *
 * @param value - The instant to serialize.
 * @returns A UTC ISO string with millisecond precision.
 * @throws `RangeError` when the input is invalid.
 */
export function nativeToUtcIsoString(value: InstantInput): string {
  return new Date(nativeParseInstant(value).epochMilliseconds).toISOString();
}
