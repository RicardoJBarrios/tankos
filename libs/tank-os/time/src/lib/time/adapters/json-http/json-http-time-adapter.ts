import {
  Instant,
  InstantInput,
  LocalDate,
  LocalDateInput,
  TimeAdapter,
} from '../../core';

/** JSON/HTTP representation of a normalized instant. */
export type JsonHttpInstant = string;

/** JSON/HTTP representation of a calendar date. */
export type JsonHttpLocalDate = string;

/** Adapter for temporal values crossing a JSON or HTTP boundary. */
export interface JsonHttpTimeAdapter {
  serializeInstant(value: InstantInput): JsonHttpInstant;
  deserializeInstant(value: unknown): Instant;
  serializeLocalDate(value: LocalDateInput): JsonHttpLocalDate;
  deserializeLocalDate(value: unknown): LocalDate;
}

/**
 * Creates a JSON/HTTP temporal adapter using canonical ISO representations.
 *
 * @param timeAdapter - Runtime implementation used to validate and normalize
 * temporal values.
 * @returns A JSON/HTTP conversion adapter.
 */
export function createJsonHttpTimeAdapter(
  timeAdapter: TimeAdapter,
): JsonHttpTimeAdapter {
  return {
    serializeInstant: (value) => timeAdapter.toUtcIsoString(value),
    deserializeInstant: (value) => {
      if (typeof value !== 'string') {
        throw new RangeError('Expected an ISO 8601 instant string');
      }
      return timeAdapter.parseInstant(value);
    },
    serializeLocalDate: (value) =>
      formatLocalDate(timeAdapter.parseLocalDate(value)),
    deserializeLocalDate: (value) => {
      if (typeof value !== 'string') {
        throw new RangeError('Expected a YYYY-MM-DD local date string');
      }
      return timeAdapter.parseLocalDate(value);
    },
  };
}

function formatLocalDate(value: LocalDate): string {
  return `${value.year.toString().padStart(4, '0')}-${value.month
    .toString()
    .padStart(2, '0')}-${value.day.toString().padStart(2, '0')}`;
}
