import { inject, Pipe, PipeTransform } from '@angular/core';
import { TimeDisplayService } from '../../application';
import { DurationInput, HumanizeDurationOptions } from '../../core';

/** Renders a signed duration as localized relative text. */
@Pipe({ name: 'tankHumanizeDuration', standalone: true, pure: false })
export class HumanizeDurationPipe implements PipeTransform {
  readonly #display = inject(TimeDisplayService);

  /** Formats a duration as relative text or returns an empty string when absent. */
  transform(
    value: DurationInput | null | undefined,
    options?: HumanizeDurationOptions,
  ): string {
    return value === null || value === undefined
      ? ''
      : this.#display.formatHumanizedDuration(value, options);
  }
}
