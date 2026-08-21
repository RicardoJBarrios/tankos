import { Duration, DurationInput } from '../../core';
import { nativeIsValidDuration } from './native-duration-validation';

const DURATION_PATTERN =
  /^([-+])?P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)(?:\.(\d{1,3}))?S)?)?$/;
const MILLISECONDS_PER_SECOND = 1_000;
const MILLISECONDS_PER_MINUTE = 60 * MILLISECONDS_PER_SECOND;
const MILLISECONDS_PER_HOUR = 60 * MILLISECONDS_PER_MINUTE;
const MILLISECONDS_PER_DAY = 24 * MILLISECONDS_PER_HOUR;

/** Parses a duration into a new normalized millisecond value. */
export function nativeParseDuration(value: DurationInput): Duration {
  if (typeof value === 'number') {
    if (!nativeIsValidDuration(value)) {
      throw new RangeError('Invalid duration');
    }
    return { kind: 'duration', milliseconds: value };
  }

  if (typeof value === 'object') {
    if (!nativeIsValidDuration(value)) {
      throw new RangeError('Invalid duration');
    }
    return { kind: 'duration', milliseconds: value.milliseconds };
  }

  const match = DURATION_PATTERN.exec(value);
  if (!match || !hasDurationComponent(match) || hasEmptyTimeComponent(value)) {
    throw new RangeError('Invalid ISO 8601 duration');
  }

  const milliseconds =
    toInteger(match[2]) * MILLISECONDS_PER_DAY +
    toInteger(match[3]) * MILLISECONDS_PER_HOUR +
    toInteger(match[4]) * MILLISECONDS_PER_MINUTE +
    toInteger(match[5]) * MILLISECONDS_PER_SECOND +
    fractionToMilliseconds(match[6]);
  const signedMilliseconds = match[1] === '-' ? -milliseconds : milliseconds;

  if (!Number.isSafeInteger(signedMilliseconds)) {
    throw new RangeError('Duration exceeds safe millisecond precision');
  }
  return { kind: 'duration', milliseconds: signedMilliseconds };
}

function hasDurationComponent(match: RegExpExecArray): boolean {
  return match.slice(2).some((component) => component !== undefined);
}

function hasEmptyTimeComponent(value: string): boolean {
  return value.includes('T') && !/[HMS]/.test(value);
}

function toInteger(value: string | undefined): number {
  return value === undefined ? 0 : Number(value);
}

function fractionToMilliseconds(value: string | undefined): number {
  return value === undefined ? 0 : Number(value.padEnd(3, '0'));
}
