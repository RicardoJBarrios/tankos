import { inject, Injectable } from '@angular/core';
import { InstantInput, LocalDateInput, TimeDisplayOptions } from '../core';
import { TIME_DISPLAY_ADAPTER } from './time-tokens';

/** Angular facade for temporal presentation operations. */
@Injectable({ providedIn: 'root' })
export class TimeDisplayService {
  readonly #adapter = inject(TIME_DISPLAY_ADAPTER);

  /** Formats an instant for user-facing display. */
  formatInstant(value: InstantInput, options?: TimeDisplayOptions): string {
    return this.#adapter.formatInstant(value, options);
  }

  /** Formats a calendar date without time-zone conversion. */
  formatLocalDate(value: LocalDateInput, options?: TimeDisplayOptions): string {
    return this.#adapter.formatLocalDate(value, options);
  }
}
