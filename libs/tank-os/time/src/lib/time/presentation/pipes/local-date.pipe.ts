import { inject, Pipe, PipeTransform } from '@angular/core';
import { TimeDisplayService } from '../../application';
import { LocalDate, TimeDisplayOptions } from '../../core';

/** Renders a calendar date without applying a time-zone conversion. */
@Pipe({ name: 'tankLocalDate', standalone: true, pure: false })
export class LocalDatePipe implements PipeTransform {
  readonly #display = inject(TimeDisplayService);

  /** Formats a present value or returns an empty string for absent input. */
  transform(
    value: LocalDate | string | null | undefined,
    format?: string,
    timeZone?: string,
    locale?: string,
    options?: TimeDisplayOptions,
  ): string {
    return value == null
      ? ''
      : this.#display.formatLocalDate(value, {
          ...options,
          ...(format === undefined ? {} : { format }),
          ...(timeZone === undefined ? {} : { timeZone }),
          ...(locale === undefined ? {} : { locale }),
        });
  }
}
