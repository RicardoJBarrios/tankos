import {
  Instant,
  InstantInput,
  LocalDate,
  LocalDateInput,
  TimeAdapter,
  Duration,
  DurationInput,
} from '../../core';
import {
  jsonHttpDateStringSchema,
  jsonHttpDurationStringSchema,
} from './json-http-schemas';

/** JSON/HTTP representation of a normalized instant. */
export type JsonHttpInstant = string;

/** JSON/HTTP representation of a calendar date. */
export type JsonHttpLocalDate = string;

/** JSON/HTTP representation of a duration. */
export type JsonHttpDuration = string;

/** Adapter for temporal values crossing a JSON or HTTP boundary. */
export interface JsonHttpTimeAdapter {
  serializeInstant(value: InstantInput): JsonHttpInstant;
  deserializeInstant(value: unknown): Instant;
  serializeLocalDate(value: LocalDateInput): JsonHttpLocalDate;
  deserializeLocalDate(value: unknown): LocalDate;
  serializeDuration(value: DurationInput): JsonHttpDuration;
  deserializeDuration(value: unknown): Duration;
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
      return timeAdapter.parseInstant(
        parseJsonDateString(value, 'Expected an ISO 8601 instant string'),
      );
    },
    serializeLocalDate: (value) =>
      formatLocalDate(timeAdapter.parseLocalDate(value)),
    deserializeLocalDate: (value) => {
      return timeAdapter.parseLocalDate(
        parseJsonDateString(value, 'Expected a YYYY-MM-DD local date string'),
      );
    },
    serializeDuration: (value) => timeAdapter.toDurationIsoString(value),
    deserializeDuration: (value) =>
      timeAdapter.parseDuration(parseJsonDurationString(value)),
  };
}

function parseJsonDurationString(value: unknown): string {
  const result = jsonHttpDurationStringSchema.safeParse(value);
  if (!result.success) {
    throw new RangeError('Expected an ISO 8601 duration string');
  }
  return result.data;
}

function parseJsonDateString(value: unknown, message: string): string {
  const result = jsonHttpDateStringSchema.safeParse(value);
  if (!result.success) {
    throw new RangeError(message);
  }
  return result.data;
}

function formatLocalDate(value: LocalDate): string {
  return `${value.year.toString().padStart(4, '0')}-${value.month
    .toString()
    .padStart(2, '0')}-${value.day.toString().padStart(2, '0')}`;
}
