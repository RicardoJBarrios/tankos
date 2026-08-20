import { inject, Injectable } from '@angular/core';
import { TIME_ADAPTER } from './time-provider';
import { Instant, InstantInput, LocalDate } from '../ports';

@Injectable({ providedIn: 'root' })
/** Facade exposing the active adapter through Angular DI. */
export class TimeService {
  readonly #adapter = inject(TIME_ADAPTER);

  /** Parses an instant through the configured adapter. */
  parseInstant(value: InstantInput): Instant {
    return this.#adapter.parseInstant(value);
  }

  /** Validates an instant through the configured adapter. */
  isValidInstant(value: unknown): value is InstantInput {
    return this.#adapter.isValidInstant(value);
  }

  /** Serializes an instant as UTC through the configured adapter. */
  toUtcIsoString(value: InstantInput): string {
    return this.#adapter.toUtcIsoString(value);
  }

  /** Parses a time-zone-independent calendar date. */
  parseLocalDate(value: string): LocalDate {
    return this.#adapter.parseLocalDate(value);
  }

  /** Validates a time-zone-independent calendar date. */
  isValidLocalDate(value: unknown): value is string {
    return this.#adapter.isValidLocalDate(value);
  }

  /** Resolves a local date-time in an explicit zone. */
  fromZonedDateTime(value: string, timeZone: string): Instant {
    return this.#adapter.fromZonedDateTime(value, timeZone);
  }

  /** Validates an IANA time-zone identifier. */
  isValidTimeZone(timeZone: string): boolean {
    return this.#adapter.isValidTimeZone(timeZone);
  }
}
