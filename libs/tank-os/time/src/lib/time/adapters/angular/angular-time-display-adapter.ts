import { DatePipe } from '@angular/common';
import {
  TimeAdapter,
  TimeDisplayAdapter,
  TimeDisplayOptions,
  TimeZoneDatabasePort,
} from '../../core';
import { toDatePipeTimeZone } from './angular-time-zone-offset';
import { createNativeTimeZoneDatabase } from '../native';

const DEFAULT_FORMAT = 'medium';
const DEFAULT_TIME_ZONE = 'UTC';

/**
 * Creates a display adapter that delegates localized output to Angular's
 * `DatePipe` while preserving TankOS temporal semantics.
 *
 * @param datePipe - Angular formatter configured with the application locale.
 * @param timeAdapter - Temporal port used to normalize input values.
 * @param defaultTimeZone - Fallback display zone when no explicit zone exists.
 * @param timeZoneDatabase - IANA rules source used to resolve display offsets.
 * @returns A TankOS display adapter backed by `DatePipe`.
 */
export function createAngularTimeDisplayAdapter(
  datePipe: DatePipe,
  timeAdapter: TimeAdapter,
  defaultTimeZone = DEFAULT_TIME_ZONE,
  timeZoneDatabase: TimeZoneDatabasePort = createNativeTimeZoneDatabase(),
): TimeDisplayAdapter {
  return {
    formatInstant(value, options) {
      const instant = timeAdapter.parseInstant(value);
      return formatDate(
        datePipe,
        instant.epochMilliseconds,
        options,
        defaultTimeZone,
        timeZoneDatabase,
      );
    },
    formatLocalDate(value, options) {
      const localDate = timeAdapter.parseLocalDate(value);
      const date = new Date(0);
      date.setUTCFullYear(localDate.year, localDate.month - 1, localDate.day);
      date.setUTCHours(0, 0, 0, 0);
      return (
        datePipe.transform(
          date.getTime(),
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
  timeZoneDatabase: TimeZoneDatabasePort,
): string {
  const timeZone = options?.timeZone ?? defaultTimeZone;
  const datePipeTimeZone = toDatePipeTimeZone(
    timeZone,
    epochMilliseconds,
    timeZoneDatabase,
  );
  return (
    datePipe.transform(
      epochMilliseconds,
      options?.format ?? DEFAULT_FORMAT,
      datePipeTimeZone,
      options?.locale,
    ) ?? ''
  );
}
