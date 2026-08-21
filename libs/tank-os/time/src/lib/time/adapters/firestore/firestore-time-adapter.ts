import { Timestamp } from 'firebase/firestore';
import {
  Instant,
  InstantInput,
  LocalDate,
  LocalDateInput,
  TimeAdapter,
} from '../../core';

/** Firestore representation used for a normalized TankOS instant. */
export type FirestoreInstant = Timestamp;

/** Adapter for temporal values stored in Firestore documents. */
export interface FirestoreTimeAdapter {
  toTimestamp(value: InstantInput): FirestoreInstant;
  fromTimestamp(value: unknown): Instant;
  toLocalDate(value: LocalDateInput): string;
  fromLocalDate(value: unknown): LocalDate;
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
      return timeAdapter.parseInstant(value.toMillis());
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
  };
}

function toLocalDateString(value: LocalDate): string {
  return `${value.year.toString().padStart(4, '0')}-${value.month
    .toString()
    .padStart(2, '0')}-${value.day.toString().padStart(2, '0')}`;
}
