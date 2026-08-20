import { inject, Injectable } from '@angular/core';
import { InstantInput, LocalDate } from '../ports/time-types';
import { TimeDisplayOptions } from '../ports/time-display-adapter';
import { TIME_DISPLAY_ADAPTER } from './time-display-provider';

/** Angular facade for temporal presentation operations. */
@Injectable({ providedIn: 'root' })
export class TimeDisplayService {
  readonly #adapter = inject(TIME_DISPLAY_ADAPTER);

  /** Formats an instant for user-facing display. */
  formatInstant(value: InstantInput, options?: TimeDisplayOptions): string {
    return this.#adapter.formatInstant(value, options);
  }

  /** Formats a calendar date without time-zone conversion. */
  formatLocalDate(
    value: LocalDate | string,
    options?: TimeDisplayOptions,
  ): string {
    return this.#adapter.formatLocalDate(value, options);
  }
}
