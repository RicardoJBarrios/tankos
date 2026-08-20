import { createUtcTimestamp } from './native-calendar-date';
import { DateTimeParts } from '../../core';

const formatterCache = new Map<string, Intl.DateTimeFormat>();

/** Returns a cached formatter for an IANA time zone. */
export function getFormatter(timeZone: string): Intl.DateTimeFormat {
  const cached = formatterCache.get(timeZone);
  if (cached) {
    return cached;
  }

  const formatter = new Intl.DateTimeFormat('en-US', {
    calendar: 'gregory',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
    minute: '2-digit',
    month: '2-digit',
    numberingSystem: 'latn',
    second: '2-digit',
    timeZone,
    year: 'numeric',
  });
  formatterCache.set(timeZone, formatter);
  return formatter;
}

/** Reads the calendar fields represented by a timestamp in a time zone. */
export function getLocalParts(
  timestamp: number,
  timeZone: string,
): DateTimeParts {
  const parts = getFormatter(timeZone).formatToParts(new Date(timestamp));
  const values = new Map(
    parts
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, Number(part.value)]),
  );

  return {
    year: Number(values.get('year')),
    month: Number(values.get('month')),
    day: Number(values.get('day')),
    hour: Number(values.get('hour')),
    minute: Number(values.get('minute')),
    second: Number(values.get('second')),
    millisecond: 0,
  };
}

/** Compares date-time fields without comparing their time-zone context. */
export function sameDateTime(
  left: DateTimeParts,
  right: DateTimeParts,
): boolean {
  return (
    left.year === right.year &&
    left.month === right.month &&
    left.day === right.day &&
    left.hour === right.hour &&
    left.minute === right.minute &&
    left.second === right.second
  );
}

/** Calculates the zone offset applicable at a timestamp. */
export function getTimeZoneOffset(timestamp: number, timeZone: string): number {
  const localParts = getLocalParts(timestamp, timeZone);
  return createUtcTimestamp(localParts) - Math.floor(timestamp / 1000) * 1000;
}

/** Samples possible offsets around a local date-time. */
export function getCandidateOffsets(
  timestamp: number,
  timeZone: string,
): Set<number> {
  const offsets = new Set<number>();
  const sampleWindow = 48 * 60 * 60 * 1000;
  const sampleStep = 30 * 60 * 1000;

  for (
    let sample = timestamp - sampleWindow;
    sample <= timestamp + sampleWindow;
    sample += sampleStep
  ) {
    offsets.add(getTimeZoneOffset(sample, timeZone));
  }

  return offsets;
}
