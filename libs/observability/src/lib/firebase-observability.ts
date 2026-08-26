import type { TelemetrySink } from './observability';

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
        ...exception.parameters,
      });
    },
  };
}

function errorDescription(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  const serialized = JSON.stringify(error);
  return typeof serialized === 'string' ? serialized : 'Unknown error';
}
