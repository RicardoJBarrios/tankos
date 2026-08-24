import {
  isValidCalendarDate,
  truncateMilliseconds,
} from '../../core/validation';
import { Instant, InstantInput } from '../../core';

const INSTANT_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d+))?(Z|[+-]\d{2}:\d{2})$/;

function parseInstantParts(value: string): RegExpExecArray {
  const match = INSTANT_PATTERN.exec(value);
  if (!match)
    throw new RangeError(
      'An instant must use ISO 8601 date-time syntax with Z or an explicit offset',
    );
  return match;
}

function assertInstantParts(
  value: string,
  parts: RegExpExecArray,
): void {
  const [, year, month, day, hour, minute, second, , offset] = parts;
  const numericOffset = offset === 'Z' ? 0 : Number(offset.slice(1, 3));
  const offsetMinutes = offset === 'Z' ? 0 : Number(offset.slice(4, 6));
  if (
    !isValidCalendarDate(Number(year), Number(month), Number(day)) ||
    Number(hour) > 23 ||
    Number(minute) > 59 ||
    Number(second) > 59 ||
    numericOffset > 23 ||
    offsetMinutes > 59
  )
    throw new RangeError(`Invalid instant: ${value}`);
}

function parseInstantString(value: string): number {
  const parts = parseInstantParts(value);
  assertInstantParts(value, parts);

  const [, year, month, day, hour, minute, second, fraction, offset] = parts;

  const milliseconds = (fraction ?? '').slice(0, 3).padEnd(3, '0');
  const normalizedValue = `${year}-${month}-${day}T${hour}:${minute}:${second}.${milliseconds}${offset}`;
  const timestamp = new Date(normalizedValue).getTime();
  if (!Number.isFinite(timestamp)) {
    throw new RangeError(`Invalid instant: ${value}`);
  }

  return timestamp;
}

/**
 * Parses an instant using the native JavaScript runtime.
 *
 * @param value - An ISO instant, epoch milliseconds or previously parsed instant.
 * @returns The normalized instant value.
 * @throws `RangeError` when the input is not a valid instant.
 */
export function nativeParseInstant(value: InstantInput): Instant {
  let epochMilliseconds: number;

  if (typeof value === 'string') {
    epochMilliseconds = parseInstantString(value);
  } else if (typeof value === 'number') {
    epochMilliseconds = truncateMilliseconds(value);
  } else {
    if (
      typeof value !== 'object' ||
      value === null ||
      value.kind !== 'instant' ||
      typeof value.epochMilliseconds !== 'number'
    ) {
      throw new RangeError('Invalid instant');
    }
    epochMilliseconds = truncateMilliseconds(value.epochMilliseconds);
  }

  epochMilliseconds = truncateMilliseconds(epochMilliseconds);

  const date = new Date(epochMilliseconds);
  if (Number.isNaN(date.getTime())) {
    throw new RangeError('Invalid instant');
  }

  return { kind: 'instant', epochMilliseconds };
}
