import {
  isValidCalendarDate,
  truncateMilliseconds,
} from '../../core/validation';
import { Instant } from '../../core';

const INSTANT_PATTERN =
  /^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})T(?<hour>\d{2}):(?<minute>\d{2}):(?<second>\d{2})(?:\.(?<fraction>\d+))?(?<offset>Z|[+-]\d{2}:\d{2})$/u;
const OFFSET_HOURS_START = 1;
const OFFSET_HOURS_END = 3;
const OFFSET_MINUTES_START = 4;
const OFFSET_MINUTES_END = 6;
const FRACTION_DIGITS = 3;
const MAX_HOUR = 23;
const MAX_MINUTE = 59;
const MAX_SECOND = 59;

function parseInstantParts(value: string): RegExpExecArray {
  const match = INSTANT_PATTERN.exec(value);
  if (!match)
    throw new RangeError(
      'An instant must use ISO 8601 date-time syntax with Z or an explicit offset',
    );
  return match;
}

function assertInstantParts(value: string, parts: RegExpExecArray): void {
  const groups = parts.groups as Record<string, string>;
  const { year, month, day, hour, minute, second, offset } = groups;
  const numericOffset =
    offset === 'Z'
      ? 0
      : Number(offset.slice(OFFSET_HOURS_START, OFFSET_HOURS_END));
  const offsetMinutes =
    offset === 'Z'
      ? 0
      : Number(offset.slice(OFFSET_MINUTES_START, OFFSET_MINUTES_END));
  if (
    !isValidInstantParts(
      Number(year),
      Number(month),
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
      numericOffset,
      offsetMinutes,
    )
  ) {
    throw new RangeError(`Invalid instant: ${value}`);
  }
}

function isValidInstantParts(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  numericOffset: number,
  offsetMinutes: number,
): boolean {
  return (
    isValidCalendarDate(year, month, day) &&
    hour <= MAX_HOUR &&
    minute <= MAX_MINUTE &&
    second <= MAX_SECOND &&
    numericOffset <= MAX_HOUR &&
    offsetMinutes <= MAX_MINUTE
  );
}

function parseInstantString(value: string): number {
  const parts = parseInstantParts(value);
  assertInstantParts(value, parts);

  const groups = parts.groups as Record<string, string>;
  const {
    year,
    month,
    day,
    hour,
    minute,
    second,
    fraction = '',
    offset,
  } = groups;

  const milliseconds = fraction
    .slice(0, FRACTION_DIGITS)
    .padEnd(FRACTION_DIGITS, '0');
  const normalizedValue = `${year}-${month}-${day}T${hour}:${minute}:${second}.${milliseconds}${offset}`;
  return new Date(normalizedValue).getTime();
}

/**
 * Parses an instant using the native JavaScript runtime.
 *
 * @param value - An ISO instant, epoch milliseconds or previously parsed instant.
 * @returns The normalized instant value.
 * @throws `RangeError` when the input is not a valid instant.
 */
export function nativeParseInstant(value: unknown): Instant {
  let epochMilliseconds: number;

  if (typeof value === 'string') {
    epochMilliseconds = parseInstantString(value);
  } else if (typeof value === 'number') {
    epochMilliseconds = truncateMilliseconds(value);
  } else {
    epochMilliseconds = parseStructuredInstant(value);
  }

  epochMilliseconds = truncateMilliseconds(epochMilliseconds);

  const date = new Date(epochMilliseconds);
  if (Number.isNaN(date.getTime())) {
    throw new RangeError('Invalid instant');
  }

  return { kind: 'instant', epochMilliseconds };
}

function parseStructuredInstant(value: unknown): number {
  const candidate = value as {
    readonly kind?: unknown;
    readonly epochMilliseconds?: unknown;
  } | null;
  if (!isValidStructuredInstant(candidate)) {
    throw new RangeError('Invalid instant');
  }
  return truncateMilliseconds(candidate.epochMilliseconds);
}

function isValidStructuredInstant(
  candidate: {
    readonly kind?: unknown;
    readonly epochMilliseconds?: unknown;
  } | null,
): candidate is {
  readonly kind: 'instant';
  readonly epochMilliseconds: number;
} {
  return (
    candidate !== null &&
    typeof candidate === 'object' &&
    candidate.kind === 'instant' &&
    typeof candidate.epochMilliseconds === 'number'
  );
}
