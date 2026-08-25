import { Duration, DurationInput } from '../../core';
import { truncateMilliseconds } from '../../core/validation';

const DURATION_PATTERN = /^[\x2b\x2d]?P(?:\d+D)?(?:T.*)?$/u;
const DATE_PATTERN = /^(?<days>\d+)D$/u;
const TIME_PATTERN =
  /^T(?:(?<hours>\d+)H)?(?:(?<minutes>\d+)M)?(?:(?<seconds>\d+)(?:\.(?<fraction>\d+))?S)?$/u;
const TIME_UNIT_PATTERN = /[HMS]/u;
const BODY_START_INDEX = 1;
const NO_INDEX = -1;
const FRACTION_DIGITS = 3;
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
  if (!match) {
    throw new RangeError('Invalid ISO 8601 duration');
  }

  const parts = durationPartsFromValue(value);
  if (!parts) {
    throw new RangeError('Invalid ISO 8601 duration');
  }

  const milliseconds =
    parts.days * MILLISECONDS_PER_DAY +
    parts.hours * MILLISECONDS_PER_HOUR +
    parts.minutes * MILLISECONDS_PER_MINUTE +
    parts.seconds * MILLISECONDS_PER_SECOND +
    fractionToMilliseconds(parts.fraction);
  const signedMilliseconds = value.startsWith('-')
    ? -milliseconds
    : milliseconds;

  return {
    kind: 'duration',
    milliseconds: truncateMilliseconds(signedMilliseconds),
  };
}

function durationPartsFromValue(value: string) {
  const unsignedValue =
    value.startsWith('-') || value.startsWith('+') ? value.slice(1) : value;
  const body = unsignedValue.slice(BODY_START_INDEX);
  const timeSeparator = body.indexOf('T');
  const datePart =
    timeSeparator === NO_INDEX ? body : body.slice(0, timeSeparator);
  const date = datePart === '' ? undefined : datePart;
  const time =
    timeSeparator === NO_INDEX
      ? undefined
      : `T${body.slice(timeSeparator + BODY_START_INDEX)}`;
  return durationParts(date, time);
}

function durationParts(date: string | undefined, time: string | undefined) {
  if (!hasDateOrTime(date, time)) return undefined;
  const dateMatch = matchDate(date);
  const timeMatch = matchTime(time);
  if (!validDurationParts(date, time, dateMatch, timeMatch)) return undefined;
  const dateGroups = dateMatch?.groups as
    { readonly days?: string } | undefined;
  const timeGroups = timeMatch?.groups as
    | {
        readonly hours?: string;
        readonly minutes?: string;
        readonly seconds?: string;
        readonly fraction?: string;
      }
    | undefined;
  return {
    days: toInteger(dateGroups?.days),
    hours: toInteger(timeGroups?.hours),
    minutes: toInteger(timeGroups?.minutes),
    seconds: toInteger(timeGroups?.seconds),
    fraction: timeGroups?.fraction,
  };
}

function validDurationParts(
  date: string | undefined,
  time: string | undefined,
  dateMatch: RegExpExecArray | undefined,
  timeMatch: RegExpExecArray | undefined,
): boolean {
  return validDate(date, dateMatch) && validTime(time, timeMatch);
}

function matchDate(date: string | undefined): RegExpExecArray | undefined {
  if (date === undefined) return undefined;
  return DATE_PATTERN.exec(date) as RegExpExecArray | undefined;
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
  if (!isValidDurationCandidate(candidate)) {
    throw new RangeError('Invalid duration');
  }
  return {
    kind: 'duration',
    milliseconds: truncateMilliseconds(candidate.milliseconds),
  };
}

function isValidDurationCandidate(candidate: Partial<Duration>): boolean {
  return (
    candidate.kind === 'duration' &&
    typeof candidate.milliseconds === 'number' &&
    Number.isSafeInteger(Math.trunc(candidate.milliseconds))
  );
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
  return (
    time === undefined || (match !== undefined && TIME_UNIT_PATTERN.test(time))
  );
}

function toInteger(value: string | undefined): number {
  return value === undefined ? 0 : Number(value);
}

function fractionToMilliseconds(value: string | undefined): number {
  return value === undefined
    ? 0
    : Number(value.slice(0, FRACTION_DIGITS).padEnd(FRACTION_DIGITS, '0'));
}
