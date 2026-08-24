import { padLeft } from '@tankos/formatting';
import { DatePipe } from '@angular/common';
import {
  DurationDisplayOptions,
  HumanizeDurationOptions,
  TimeDisplayAdapter,
  TimeDisplayOptions,
  TimeLocalePort,
  TimePort,
  TimeZoneDatabasePort,
} from '../../core';
import { toDatePipeTimeZone } from './angular-time-zone-offset';

const DEFAULT_FORMAT = 'medium';
const DEFAULT_TIME_ZONE = 'UTC';
const DEFAULT_LOCALE = 'en-US';
const MILLISECONDS_PER_SECOND = 1_000;
const MILLISECONDS_PER_MINUTE = 60 * MILLISECONDS_PER_SECOND;
const MILLISECONDS_PER_HOUR = 60 * MILLISECONDS_PER_MINUTE;
const MILLISECONDS_PER_DAY = 24 * MILLISECONDS_PER_HOUR;

/**
 * Creates a display adapter that delegates localized output to Angular's
 * `DatePipe` while preserving TankOS temporal semantics.
 *
 * @param datePipe - Angular formatter configured with the application locale.
 * @param timePort - Temporal port used to normalize input values.
 * @param defaultTimeZone - Fallback display zone when no explicit zone exists.
 * @param timeZoneDatabase - IANA rules source used to resolve display offsets.
 * @param localePort - Locale source for localized styles. A string is retained
 * as a compatibility shorthand for a fixed locale.
 * @returns A TankOS display adapter backed by `DatePipe`.
 */
export function createAngularTimeDisplayAdapter(
  datePipe: DatePipe,
  timePort: TimePort,
  defaultTimeZone = DEFAULT_TIME_ZONE,
  timeZoneDatabase: TimeZoneDatabasePort,
  localePort: TimeLocalePort | string = DEFAULT_LOCALE,
): TimeDisplayAdapter {
  return {
    formatInstant(value, options) {
      const instant = timePort.parseInstant(value);
      return formatDate(
        datePipe,
        instant.epochMilliseconds,
        options,
        defaultTimeZone,
        timeZoneDatabase,
        getExplicitLocale(options, localePort),
      );
    },
    formatLocalDate(value, options) {
      const localDate = timePort.parseLocalDate(value);
      const date = new Date(0);
      date.setUTCFullYear(localDate.year, localDate.month - 1, localDate.day);
      date.setUTCHours(0, 0, 0, 0);
      return (
        datePipe.transform(
          date.getTime(),
          options?.format ?? 'mediumDate',
          '+0000',
          getExplicitLocale(options, localePort),
        ) ?? ''
      );
    },
    formatDuration(value, options) {
      return formatDuration(timePort, value, options, getLocale(localePort));
    },
    formatHumanizedDuration(value, options) {
      return formatHumanizedDuration(
        timePort,
        value,
        options,
        getLocale(localePort),
      );
    },
  };
}

function getLocale(localePort: TimeLocalePort | string): string {
  return typeof localePort === 'string' ? localePort : localePort.getLocale();
}

function getExplicitLocale(
  options: TimeDisplayOptions | undefined,
  localePort: TimeLocalePort | string,
): string | undefined {
  return (
    options?.locale ??
    (typeof localePort === 'string' ? undefined : localePort.getLocale())
  );
}

function formatDuration(
  timePort: TimePort,
  value: Parameters<TimeDisplayAdapter['formatDuration']>[0],
  options: DurationDisplayOptions | undefined,
  defaultLocale: string,
): string {
  const style = options?.style ?? 'short';
  if (style === 'iso') {
    return timePort.toDurationIsoString(value);
  }

  const milliseconds = timePort.parseDuration(value).milliseconds;
  const sign = milliseconds < 0 ? '-' : '';
  const parts = durationParts(Math.abs(milliseconds));
  if (style === 'digital') {
    return `${sign}${formatDigital(parts)}`;
  }

  const locale = options?.locale ?? defaultLocale;

  const unitDisplay = style === 'long' ? 'long' : 'short';
  const units = [
    ['day', parts.days],
    ['hour', parts.hours],
    ['minute', parts.minutes],
    ['second', parts.seconds],
    ['millisecond', parts.milliseconds],
  ] as const;
  const visibleUnits = units.filter(([, amount]) => amount > 0);
  if (visibleUnits.length === 0) {
    visibleUnits.push(['millisecond', 0]);
  }

  const formatted = visibleUnits.map(([unit, amount]) =>
    new Intl.NumberFormat(locale, {
      style: 'unit',
      unit,
      unitDisplay,
    }).format(amount),
  );
  return `${sign}${formatted.join(', ')}`;
}

function formatHumanizedDuration(
  timePort: TimePort,
  value: Parameters<TimeDisplayAdapter['formatHumanizedDuration']>[0],
  options: HumanizeDurationOptions | undefined,
  defaultLocale: string,
): string {
  const milliseconds = timePort.parseDuration(value).milliseconds;
  return formatRelativeDuration(
    milliseconds,
    options?.locale ?? defaultLocale,
    options?.calendarUnits ?? 'none',
  );
}

function formatRelativeDuration(
  milliseconds: number,
  locale: string,
  calendarUnits: 'none' | 'approximate',
): string {
  const absoluteMilliseconds = Math.abs(milliseconds);
  const approximateCalendarUnit =
    calendarUnits === 'approximate' &&
    absoluteMilliseconds >= 30 * MILLISECONDS_PER_DAY
      ? absoluteMilliseconds >= 365 * MILLISECONDS_PER_DAY
        ? (['year', 365 * MILLISECONDS_PER_DAY] as const)
        : (['month', 30 * MILLISECONDS_PER_DAY] as const)
      : undefined;
  const [unit, divisor] =
    approximateCalendarUnit ??
    (absoluteMilliseconds >= MILLISECONDS_PER_DAY
      ? (['day', MILLISECONDS_PER_DAY] as const)
      : absoluteMilliseconds >= MILLISECONDS_PER_HOUR
        ? (['hour', MILLISECONDS_PER_HOUR] as const)
        : absoluteMilliseconds >= MILLISECONDS_PER_MINUTE
          ? (['minute', MILLISECONDS_PER_MINUTE] as const)
          : (['second', MILLISECONDS_PER_SECOND] as const));
  const amount = Math.round(milliseconds / divisor);
  return new Intl.RelativeTimeFormat(locale, {
    numeric: 'auto',
    style: 'long',
  }).format(amount, unit);
}

function durationParts(milliseconds: number): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
} {
  let remainder = milliseconds;
  const days = Math.floor(remainder / MILLISECONDS_PER_DAY);
  remainder %= MILLISECONDS_PER_DAY;
  const hours = Math.floor(remainder / MILLISECONDS_PER_HOUR);
  remainder %= MILLISECONDS_PER_HOUR;
  const minutes = Math.floor(remainder / MILLISECONDS_PER_MINUTE);
  remainder %= MILLISECONDS_PER_MINUTE;
  const seconds = Math.floor(remainder / MILLISECONDS_PER_SECOND);
  return {
    days,
    hours,
    minutes,
    seconds,
    milliseconds: remainder % MILLISECONDS_PER_SECOND,
  };
}

function formatDigital(parts: ReturnType<typeof durationParts>): string {
  const totalHours = parts.days * 24 + parts.hours;
  return [totalHours, parts.minutes, parts.seconds]
    .map((value) => padLeft(value.toString(), 2))
    .join(':');
}

function formatDate(
  datePipe: DatePipe,
  epochMilliseconds: number,
  options: TimeDisplayOptions | undefined,
  defaultTimeZone: string,
  timeZoneDatabase: TimeZoneDatabasePort,
  locale: string | undefined,
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
      locale,
    ) ?? ''
  );
}
