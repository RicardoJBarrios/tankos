import { inject, Pipe, PipeTransform } from '@angular/core';
import { LocalDate } from '../../ports/time-types';
import { TimeDisplayOptions } from '../../ports/time-display-adapter';
import { TimeDisplayService } from '../../application/time-display-service';

/** Renders a calendar date without applying a time-zone conversion. */
@Pipe({ name: 'tankLocalDate', standalone: true, pure: true })
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
