import { inject, Pipe, PipeTransform } from '@angular/core';
import { TimeDisplayService } from '../../application';
import { DurationDisplayOptions, DurationInput } from '../../core';

/** Renders an elapsed duration through the configured display adapter. */
@Pipe({ name: 'tankDuration', standalone: true, pure: false })
export class DurationPipe implements PipeTransform {
  readonly #display = inject(TimeDisplayService);

  /** Formats a present duration or returns an empty string for absent input. */
  transform(
    value: DurationInput | null | undefined,
    style?: DurationDisplayOptions['style'],
    locale?: string,
  ): string {
    return value == null
      ? ''
      : this.#display.formatDuration(value, {
          ...(style === undefined ? {} : { style }),
          ...(locale === undefined ? {} : { locale }),
        });
  }
}
