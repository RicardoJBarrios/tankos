import { createUtcTimestamp } from './native-calendar-date';
import { getLocalParts } from './native-time-zone-local-parts';

/** Calculates the zone offset applicable at a timestamp in milliseconds. */
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
  )
    offsets.add(getTimeZoneOffset(sample, timeZone));
  return offsets;
}
