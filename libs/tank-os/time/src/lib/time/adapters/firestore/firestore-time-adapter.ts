import { Timestamp } from 'firebase/firestore';
import { firestoreTimestampSchema } from './firestore-schemas';
import {
  Instant,
  InstantInput,
  LocalDate,
  LocalDateInput,
  CalendarPort,
  DurationPort,
  InstantPort,
  Duration,
  DurationInput,
} from '../../core';
import {
  truncateMilliseconds,
  truncateTimestampMilliseconds,
} from '../../core/validation';

/** Firestore representation used for a normalized TankOS instant. */
export type FirestoreInstant = Timestamp;

/** Firestore representation used for a duration, in integer milliseconds. */
export type FirestoreDuration = number;

/** Adapter for temporal values stored in Firestore documents. */
export interface FirestoreTimeAdapter {
  toTimestamp(value: InstantInput): FirestoreInstant;
  fromTimestamp(value: unknown): Instant;
  toLocalDate(value: LocalDateInput): string;
  fromLocalDate(value: unknown): LocalDate;
  toDuration(value: DurationInput): FirestoreDuration;
  fromDuration(value: unknown): Duration;
}

/**
 * Creates a Firestore temporal adapter backed by the active time port.
 *
 * @param timePort - Runtime implementation used to validate and normalize
 * temporal values.
 * @returns A Firestore conversion adapter.
 */
export function createFirestoreTimeAdapter(
  timePort: CalendarPort & DurationPort & InstantPort,
): FirestoreTimeAdapter {
  return {
    toTimestamp(value) {
      return Timestamp.fromMillis(
        timePort.parseInstant(value).epochMilliseconds,
      );
    },
    fromTimestamp(value) {
      if (!(value instanceof Timestamp)) {
        throw new RangeError('Expected a Firestore Timestamp');
      }
      const timestamp = firestoreTimestampSchema.parse(value);
      const milliseconds = truncateTimestampMilliseconds(
        timestamp.seconds,
        timestamp.nanoseconds,
      );
      return timePort.parseInstant(milliseconds);
    },
    toLocalDate(value) {
      return toLocalDateString(timePort.parseLocalDate(value));
    },
    fromLocalDate(value) {
      if (typeof value !== 'string') {
        throw new RangeError('Expected a Firestore local date string');
      }
      return timePort.parseLocalDate(value);
    },
    toDuration(value) {
      return timePort.parseDuration(value).milliseconds;
    },
    fromDuration(value) {
      if (
        typeof value !== 'number' ||
        !Number.isSafeInteger(Math.trunc(value))
      ) {
        throw new RangeError('Expected finite duration milliseconds');
      }
      return timePort.parseDuration(truncateMilliseconds(value));
    },
  };
}

function toLocalDateString(value: LocalDate): string {
  return `${value.year.toString().padStart(4, '0')}-${value.month
    .toString()
    .padStart(2, '0')}-${value.day.toString().padStart(2, '0')}`;
}
