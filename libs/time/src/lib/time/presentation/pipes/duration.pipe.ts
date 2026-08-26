import { inject, Pipe, PipeTransform } from '@angular/core';
import { TimeDisplayService } from '../../application';
import { DurationDisplayOptions, DurationInput } from '../../core';

/** Renders an elapsed duration through the configured display adapter. */
@Pipe({ name: 'tankDuration', standalone: true, pure: false })
export class DurationPipe implements PipeTransform {
  readonly #display = inject(TimeDisplayService);

  /** Formats a present duration or returns an empty string for absent input. */
  public transform(
    value: DurationInput | null | undefined,
    style?: DurationDisplayOptions['style'],
    locale?: string,
  ): string {
    if (value === null || value === undefined) return '';
    const options: {
      style?: NonNullable<DurationDisplayOptions['style']>;
      locale?: string;
    } = {};
    if (style !== undefined) options.style = style;
    if (locale !== undefined) options.locale = locale;
    return this.#display.formatDuration(value, options);
  }
}
