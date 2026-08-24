import { Instant, InstantInput } from '../value-types';

/** Port for parsing, validating and serializing normalized instants. */
export interface InstantPort {
  /** Parses an accepted input into a normalized UTC instant. */
  parseInstant(value: InstantInput): Instant;
  /** Returns whether an unknown value is accepted as an instant input. */
  isValidInstant(value: unknown): value is InstantInput;
  /** Serializes an instant as a canonical UTC ISO string. */
  toUtcIsoString(value: InstantInput): string;
}
