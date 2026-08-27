import type { TelemetrySink } from './observability';
import { sanitizeObservabilityValue } from './safe-observability';

const MAX_TEXT_LENGTH = 512;

export type FirebaseAnalyticsLike = object;

export type FirebaseLogEvent = (
  analytics: FirebaseAnalyticsLike,
  name: string,
  parameters?: Readonly<Record<string, unknown>>,
) => void;

/** Adapts Firebase Analytics without importing Firebase into the core API. */
export function createFirebaseTelemetrySink(
  analytics: FirebaseAnalyticsLike,
  logEvent: FirebaseLogEvent,
): TelemetrySink {
  return {
    trackEvent: (event) => {
      logEvent(analytics, event.name, event.parameters);
    },
    trackException: (exception) => {
      logEvent(analytics, 'exception', {
        description: errorDescription(exception.error),
        fatal: exception.fatal ?? false,
        ...sanitizeParameters(exception.parameters),
      });
    },
  };
}

function errorDescription(error: unknown): string {
  if (error instanceof Error) return error.name;
  if (typeof error === 'string') return error.slice(0, MAX_TEXT_LENGTH);
  const serialized = JSON.stringify(sanitizeObservabilityValue(error));
  return typeof serialized === 'string' ? serialized : 'Unknown error';
}

function sanitizeParameters(
  parameters: Readonly<Record<string, unknown>> | undefined,
): Readonly<Record<string, unknown>> {
  const value = sanitizeObservabilityValue(parameters);
  return isObjectRecord(value) ? value : {};
}

function isObjectRecord(
  value: unknown,
): value is Readonly<Record<string, unknown>> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
