import { createUtcTimestamp } from './native-calendar-date';
import { getLocalParts } from './native-time-zone-local-parts';

const MILLISECONDS_PER_SECOND = 1_000;
const HOURS_IN_SAMPLE_WINDOW = 48;
const MINUTES_PER_HOUR = 60;
const MILLISECONDS_PER_MINUTE = 60_000;
const SAMPLE_INTERVAL_MINUTES = 30;

/** Calculates the zone offset applicable at a timestamp in milliseconds. */
export function getTimeZoneOffset(timestamp: number, timeZone: string): number {
  const localParts = getLocalParts(timestamp, timeZone);
  return (
    createUtcTimestamp(localParts) -
    Math.floor(timestamp / MILLISECONDS_PER_SECOND) * MILLISECONDS_PER_SECOND
  );
}

/** Samples possible offsets around a local date-time. */
export function getCandidateOffsets(
  timestamp: number,
  timeZone: string,
): Set<number> {
  const offsets = new Set<number>();
  const sampleWindow =
    HOURS_IN_SAMPLE_WINDOW * MINUTES_PER_HOUR * MILLISECONDS_PER_MINUTE;
  const sampleStep = SAMPLE_INTERVAL_MINUTES * MILLISECONDS_PER_MINUTE;
  for (
    let sample = timestamp - sampleWindow;
    sample <= timestamp + sampleWindow;
    sample += sampleStep
  )
    offsets.add(getTimeZoneOffset(sample, timeZone));
  return offsets;
}
