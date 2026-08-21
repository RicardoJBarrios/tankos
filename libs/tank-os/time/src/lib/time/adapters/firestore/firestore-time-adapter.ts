import { Timestamp } from 'firebase/firestore';
import { firestoreTimestampSchema } from './firestore-schemas';
import {
  Instant,
  InstantInput,
  LocalDate,
  LocalDateInput,
  TimeAdapter,
  Duration,
  DurationInput,
} from '../../core';

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
 * @param timeAdapter - Runtime implementation used to validate and normalize
 * temporal values.
 * @returns A Firestore conversion adapter.
 */
export function createFirestoreTimeAdapter(
  timeAdapter: TimeAdapter,
): FirestoreTimeAdapter {
  return {
    toTimestamp(value) {
      return Timestamp.fromMillis(
        timeAdapter.parseInstant(value).epochMilliseconds,
      );
    },
    fromTimestamp(value) {
      if (!(value instanceof Timestamp)) {
        throw new RangeError('Expected a Firestore Timestamp');
      }
      const timestamp = firestoreTimestampSchema.parse(value);
      if (timestamp.nanoseconds % 1_000_000 !== 0) {
        throw new RangeError(
          'Firestore Timestamp must have millisecond precision',
        );
      }
      const milliseconds = timestamp.toMillis();
      return timeAdapter.parseInstant(milliseconds);
    },
    toLocalDate(value) {
      return toLocalDateString(timeAdapter.parseLocalDate(value));
    },
    fromLocalDate(value) {
      if (typeof value !== 'string') {
        throw new RangeError('Expected a Firestore local date string');
      }
      return timeAdapter.parseLocalDate(value);
    },
    toDuration(value) {
      return timeAdapter.parseDuration(value).milliseconds;
    },
    fromDuration(value) {
      if (typeof value !== 'number' || !Number.isSafeInteger(value)) {
        throw new RangeError('Expected integer millisecond duration');
      }
      return timeAdapter.parseDuration(value);
    },
  };
}

function toLocalDateString(value: LocalDate): string {
  return `${value.year.toString().padStart(4, '0')}-${value.month
    .toString()
    .padStart(2, '0')}-${value.day.toString().padStart(2, '0')}`;
}
