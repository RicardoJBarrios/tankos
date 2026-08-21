import { z } from 'zod';
import type {
  CalendarPort,
  DurationPort,
  InstantPort,
  TimeZoneDatabasePort,
} from '@tank-os/time';
import type { Duration, Instant, LocalDate } from '@tank-os/time';

/** Zod schemas for canonical JSON/HTTP temporal strings. */
export interface ZodTimeSchemas {
  /** Parses a canonical or supported ISO instant into an Instant. */
  readonly instant: z.ZodType<Instant>;
  /** Parses a YYYY-MM-DD calendar string into a LocalDate. */
  readonly localDate: z.ZodType<LocalDate>;
  /** Parses an ISO 8601 duration into a millisecond Duration. */
  readonly duration: z.ZodType<Duration>;
  /** Validates an IANA time-zone identifier. */
  readonly timeZone: z.ZodType<string>;
}

/**
 * Creates Zod schemas backed by the active Time ports.
 *
 * @param timePort - Calendar, duration and instant parser port.
 * @param timeZoneDatabase - IANA time-zone database port.
 * @returns Schemas that validate and map external strings into Time values.
 */
export function createZodTimeSchemas(
  timePort: CalendarPort & DurationPort & InstantPort,
  timeZoneDatabase: TimeZoneDatabasePort,
): ZodTimeSchemas {
  return {
    instant: z
      .string()
      .transform((value, context) =>
        parseWithPort(() => timePort.parseInstant(value), 'instant', context),
      ),
    localDate: z
      .string()
      .transform((value, context) =>
        parseWithPort(
          () => timePort.parseLocalDate(value),
          'local date',
          context,
        ),
      ),
    duration: z
      .string()
      .transform((value, context) =>
        parseWithPort(() => timePort.parseDuration(value), 'duration', context),
      ),
    timeZone: z.string().superRefine((value, context) => {
      if (!timeZoneDatabase.isValid(value)) {
        context.addIssue({
          code: 'custom',
          message: `Invalid IANA time zone: ${value}`,
        });
      }
    }),
  };
}

function parseWithPort<T>(
  parser: () => T,
  label: string,
  context: z.RefinementCtx,
): T | typeof z.NEVER {
  try {
    return parser();
  } catch (error) {
    context.addIssue({
      code: 'custom',
      message: String(error) || `Invalid ${label}`,
    });
    return z.NEVER;
  }
}
