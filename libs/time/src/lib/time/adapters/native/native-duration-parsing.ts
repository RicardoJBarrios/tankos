import { Duration, DurationInput } from '../../core';
import { truncateMilliseconds } from '../../core/validation';

const DURATION_PATTERN = /^([-+]?)P(?<date>\d+D)?(?<time>T.*)?$/;
const DATE_PATTERN = /^(\d+)D$/;
const TIME_PATTERN = /^T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)(?:\.(\d+))?S)?$/;
const MILLISECONDS_PER_SECOND = 1_000;
const MILLISECONDS_PER_MINUTE = 60 * MILLISECONDS_PER_SECOND;
const MILLISECONDS_PER_HOUR = 60 * MILLISECONDS_PER_MINUTE;
const MILLISECONDS_PER_DAY = 24 * MILLISECONDS_PER_HOUR;

/** Parses a duration into a new normalized millisecond value. */
export function nativeParseDuration(value: DurationInput): Duration {
  if (typeof value === 'number') {
    return parseNumericDuration(value);
  }

  if (typeof value === 'object') {
    return parseObjectDuration(value);
  }

  const match = DURATION_PATTERN.exec(value);
  const parts = match ? durationPartsFromMatch(match) : undefined;
  if (!parts) {
    throw new RangeError('Invalid ISO 8601 duration');
  }

  const milliseconds =
    parts.days * MILLISECONDS_PER_DAY +
    parts.hours * MILLISECONDS_PER_HOUR +
    parts.minutes * MILLISECONDS_PER_MINUTE +
    parts.seconds * MILLISECONDS_PER_SECOND +
    fractionToMilliseconds(parts.fraction);
  const signedMilliseconds = match[1] === '-' ? -milliseconds : milliseconds;

  return {
    kind: 'duration',
    milliseconds: truncateMilliseconds(signedMilliseconds),
  };
}

function durationPartsFromMatch(match: RegExpExecArray) {
  const groups = match.groups as {
    readonly date?: string;
    readonly time?: string;
  };
  return durationParts(groups.date, groups.time);
}

function durationParts(date: string | undefined, time: string | undefined) {
  if (!hasDateOrTime(date, time)) return undefined;
  const dateMatch = matchDate(date);
  const timeMatch = matchTime(time);
  if (!validDate(date, dateMatch)) return undefined;
  if (!validTime(time, timeMatch)) return undefined;
  return {
    days: toInteger(dateMatch?.[1]),
    hours: toInteger(timeMatch?.[1]),
    minutes: toInteger(timeMatch?.[2]),
    seconds: toInteger(timeMatch?.[3]),
    fraction: timeMatch?.[4],
  };
}

function matchDate(date: string | undefined): RegExpExecArray | undefined {
  if (date === undefined) return undefined;
  return DATE_PATTERN.exec(date) ?? undefined;
}

function matchTime(time: string | undefined): RegExpExecArray | undefined {
  if (time === undefined) return undefined;
  return TIME_PATTERN.exec(time) ?? undefined;
}

function parseNumericDuration(value: number): Duration {
  if (!Number.isSafeInteger(Math.trunc(value)))
    throw new RangeError('Invalid duration');
  return { kind: 'duration', milliseconds: truncateMilliseconds(value) };
}

function parseObjectDuration(value: DurationInput & object): Duration {
  const candidate = value as Partial<Duration>;
  if (
    candidate.kind !== 'duration' ||
    typeof candidate.milliseconds !== 'number' ||
    !Number.isSafeInteger(Math.trunc(candidate.milliseconds))
  )
    throw new RangeError('Invalid duration');
  return {
    kind: 'duration',
    milliseconds: truncateMilliseconds(candidate.milliseconds),
  };
}

function hasDateOrTime(
  date: string | undefined,
  time: string | undefined,
): boolean {
  return date !== undefined || time !== undefined;
}

function validDate(
  date: string | undefined,
  match: RegExpExecArray | undefined,
): boolean {
  return date === undefined || match !== undefined;
}

function validTime(
  time: string | undefined,
  match: RegExpExecArray | undefined,
): boolean {
  return time === undefined || (match !== undefined && /[HMS]/.test(time));
}

function toInteger(value: string | undefined): number {
  return value === undefined ? 0 : Number(value);
}

function fractionToMilliseconds(value: string | undefined): number {
  return value === undefined ? 0 : Number(value.slice(0, 3).padEnd(3, '0'));
}
