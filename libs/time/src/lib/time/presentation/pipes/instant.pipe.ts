import { inject, Pipe, PipeTransform } from '@angular/core';
import { TimeDisplayService } from '../../application';
import { InstantInput, TimeDisplayOptions } from '../../core';

/** Renders an instant using the configured temporal display adapter. */
@Pipe({ name: 'tankInstant', standalone: true, pure: false })
export class InstantPipe implements PipeTransform {
  readonly #display = inject(TimeDisplayService);

  /** Formats a present value or returns an empty string for absent input. */
  public transform(
    value: InstantInput | null | undefined,
    format?: string,
    timeZone?: string,
    locale?: string,
    options?: TimeDisplayOptions,
  ): string {
    if (value === null || value === undefined) return '';
    const displayOptions: {
      format?: string;
      timeZone?: string;
      locale?: string;
    } = { ...options };
    if (format !== undefined) displayOptions.format = format;
    if (timeZone !== undefined) displayOptions.timeZone = timeZone;
    if (locale !== undefined) displayOptions.locale = locale;
    return this.#display.formatInstant(value, displayOptions);
  }
}
