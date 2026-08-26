export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogContext = Readonly<Record<string, unknown>>;

export interface LogRecord {
  readonly level: LogLevel;
  readonly message: string;
  readonly context?: LogContext;
  readonly error?: unknown;
  readonly timestamp: string;
}

export interface LogSink {
  write(record: LogRecord): void;
}

export interface Logger {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext, error?: unknown): void;
}

/** Logger implementation for libraries that do not require host logging. */
export function createNoopLogger(): Logger {
  return {
    debug: () => undefined,
    info: () => undefined,
    warn: () => undefined,
    error: () => undefined,
  };
}

export interface TelemetryEvent {
  readonly name: string;
  readonly parameters?: Readonly<Record<string, unknown>>;
}

export interface TelemetryException {
  readonly error: unknown;
  readonly fatal?: boolean;
  readonly parameters?: Readonly<Record<string, unknown>>;
}

export interface TelemetrySink {
  trackEvent(event: TelemetryEvent): void;
  trackException(exception: TelemetryException): void;
}

export interface Telemetry {
  trackEvent(event: TelemetryEvent): void;
  trackException(exception: TelemetryException): void;
}

export interface Observability {
  readonly logger: Logger;
  readonly telemetry: Telemetry;
}

export interface ObservabilityOptions {
  readonly minimumLogLevel?: LogLevel;
  readonly logSinks?: readonly LogSink[];
  readonly telemetrySinks?: readonly TelemetrySink[];
  readonly now?: () => Date;
}

const LOG_LEVEL_PRIORITY: Readonly<Record<LogLevel, number>> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export function createObservability(
  options: ObservabilityOptions = {},
): Observability {
  const minimumLogLevel = options.minimumLogLevel ?? 'info';
  const now = options.now ?? (() => new Date());
  const logSinks = options.logSinks ?? [];
  const telemetrySinks = options.telemetrySinks ?? [];

  return {
    logger: createLogger(minimumLogLevel, logSinks, now),
    telemetry: createTelemetry(telemetrySinks),
  };
}

function createLogger(
  minimumLogLevel: LogLevel,
  sinks: readonly LogSink[],
  now: () => Date,
): Logger {
  return {
    debug: (message, context) => {
      writeLog(sinks, now, minimumLogLevel, 'debug', message, context);
    },
    info: (message, context) => {
      writeLog(sinks, now, minimumLogLevel, 'info', message, context);
    },
    warn: (message, context) => {
      writeLog(sinks, now, minimumLogLevel, 'warn', message, context);
    },
    error: (message, context, error) => {
      writeLog(sinks, now, minimumLogLevel, 'error', message, context, error);
    },
  };
}

function writeLog(
  sinks: readonly LogSink[],
  now: () => Date,
  minimumLogLevel: LogLevel,
  level: LogLevel,
  message: string,
  context?: LogContext,
  error?: unknown,
): void {
  if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[minimumLogLevel]) return;
  const record: LogRecord = {
    level,
    message,
    ...(context ? { context } : {}),
    ...(error !== undefined ? { error } : {}),
    timestamp: now().toISOString(),
  };
  for (const sink of sinks) safelyWrite(sink, record);
}

function createTelemetry(sinks: readonly TelemetrySink[]): Telemetry {
  return {
    trackEvent: (event) => {
      for (const sink of sinks) safelyTrackEvent(sink, event);
    },
    trackException: (exception) => {
      for (const sink of sinks) safelyTrackException(sink, exception);
    },
  };
}

function safelyWrite(sink: LogSink, record: LogRecord): void {
  try {
    sink.write(record);
  } catch {
    // Observability must never break the application it observes.
  }
}

function safelyTrackEvent(sink: TelemetrySink, event: TelemetryEvent): void {
  try {
    sink.trackEvent(event);
  } catch {
    // Telemetry failures are intentionally isolated from application flow.
  }
}

function safelyTrackException(
  sink: TelemetrySink,
  exception: TelemetryException,
): void {
  try {
    sink.trackException(exception);
  } catch {
    // Telemetry failures are intentionally isolated from application flow.
  }
}
