import { Duration, DurationInput } from '../value-types';

/** Port for parsing, validating and serializing elapsed durations. */
export interface DurationPort {
  /** Parses an accepted input into an integer-millisecond duration. */
  parseDuration(value: DurationInput): Duration;
  /** Returns whether an unknown value is accepted as a duration input. */
  isValidDuration(value: unknown): value is DurationInput;
  /** Serializes a duration as a canonical ISO 8601 string. */
  toDurationIsoString(value: DurationInput): string;
}
