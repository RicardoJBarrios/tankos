import { inject, Pipe, PipeTransform } from '@angular/core';
import { TimeDisplayService } from '../../application';
import { LocalDate, TimeDisplayOptions } from '../../core';

/** Renders a calendar date without applying a time-zone conversion. */
@Pipe({ name: 'tankLocalDate', standalone: true, pure: false })
export class LocalDatePipe implements PipeTransform {
  readonly #display = inject(TimeDisplayService);

  /** Formats a present value or returns an empty string for absent input. */
  public transform(
    value: LocalDate | string | null | undefined,
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
    return this.#display.formatLocalDate(value, displayOptions);
  }
}
