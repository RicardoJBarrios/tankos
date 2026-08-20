import { DatePipe } from '@angular/common';
import {
  TimeAdapter,
  TimeDisplayAdapter,
  TimeDisplayOptions,
} from '../../ports';
import { toDatePipeTimeZone } from './angular-time-zone-offset';

const DEFAULT_FORMAT = 'medium';
const DEFAULT_TIME_ZONE = 'UTC';

/**
 * Creates a display adapter that delegates localized output to Angular's
 * `DatePipe` while preserving TankOS temporal semantics.
 *
 * @param datePipe - Angular formatter configured with the application locale.
 * @param defaultTimeZone - Fallback display zone when no explicit zone exists.
 * @returns A TankOS display adapter backed by `DatePipe`.
 */
export function createAngularTimeDisplayAdapter(
  datePipe: DatePipe,
  timeAdapter: TimeAdapter,
  defaultTimeZone = DEFAULT_TIME_ZONE,
): TimeDisplayAdapter {
  return {
    formatInstant(value, options) {
      const instant = timeAdapter.parseInstant(value);
      return formatDate(
        datePipe,
        instant.epochMilliseconds,
        options,
        defaultTimeZone,
      );
    },
    formatLocalDate(value, options) {
      const localDate = timeAdapter.parseLocalDate(value);
      const epochMilliseconds = Date.UTC(
        localDate.year,
        localDate.month - 1,
        localDate.day,
      );
      return (
        datePipe.transform(
          epochMilliseconds,
          options?.format ?? 'mediumDate',
          '+0000',
          options?.locale,
        ) ?? ''
      );
    },
  };
}

function formatDate(
  datePipe: DatePipe,
  epochMilliseconds: number,
  options: TimeDisplayOptions | undefined,
  defaultTimeZone: string,
): string {
  const timeZone = options?.timeZone ?? defaultTimeZone;
  const datePipeTimeZone = toDatePipeTimeZone(timeZone, epochMilliseconds);
  return (
    datePipe.transform(
      epochMilliseconds,
      options?.format ?? DEFAULT_FORMAT,
      datePipeTimeZone,
      options?.locale,
    ) ?? ''
  );
}
