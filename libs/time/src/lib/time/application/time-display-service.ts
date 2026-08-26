import { inject, Injectable } from '@angular/core';
import {
  DurationDisplayOptions,
  DurationInput,
  HumanizeDurationOptions,
  InstantInput,
  LocalDateInput,
  TimeDisplayOptions,
} from '../core';
import { TIME_DISPLAY_ADAPTER } from './time-tokens';

/** Angular facade for temporal presentation operations. */
@Injectable({ providedIn: 'root' })
export class TimeDisplayService {
  readonly #adapter = inject(TIME_DISPLAY_ADAPTER);

  /** Formats an instant for user-facing display. */
  public formatInstant(
    value: InstantInput,
    options?: TimeDisplayOptions,
  ): string {
    return this.#adapter.formatInstant(value, options);
  }

  /** Formats a calendar date without time-zone conversion. */
  public formatLocalDate(
    value: LocalDateInput,
    options?: TimeDisplayOptions,
  ): string {
    return this.#adapter.formatLocalDate(value, options);
  }

  /** Formats an elapsed duration for user-facing display. */
  public formatDuration(
    value: DurationInput,
    options?: DurationDisplayOptions,
  ): string {
    return this.#adapter.formatDuration(value, options);
  }

  /** Formats an elapsed duration as localized relative text. */
  public formatHumanizedDuration(
    value: DurationInput,
    options?: HumanizeDurationOptions,
  ): string {
    return this.#adapter.formatHumanizedDuration(value, options);
  }
}
