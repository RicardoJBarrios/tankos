import { inject, Pipe, PipeTransform } from '@angular/core';
import { InstantInput } from '../../ports/time-types';
import { TimeDisplayOptions } from '../../ports/time-display-adapter';
import { TimeDisplayService } from '../../application/time-display-service';

/** Renders an instant using the configured temporal display adapter. */
@Pipe({ name: 'tankInstant', standalone: true, pure: true })
export class InstantPipe implements PipeTransform {
  readonly #display = inject(TimeDisplayService);

  /** Formats a present value or returns an empty string for absent input. */
  transform(
    value: InstantInput | null | undefined,
    format?: string,
    timeZone?: string,
    locale?: string,
    options?: TimeDisplayOptions,
  ): string {
    return value == null
      ? ''
      : this.#display.formatInstant(value, {
          ...options,
          ...(format === undefined ? {} : { format }),
          ...(timeZone === undefined ? {} : { timeZone }),
          ...(locale === undefined ? {} : { locale }),
        });
  }
}
