import type { LogSink } from './observability';
import { sanitizeObservabilityValue } from './safe-observability';

export interface ConsoleLike {
  debug(...arguments_: readonly unknown[]): void;
  info(...arguments_: readonly unknown[]): void;
  warn(...arguments_: readonly unknown[]): void;
  error(...arguments_: readonly unknown[]): void;
}

export function createConsoleLogSink(
  consoleLike: ConsoleLike = console,
): LogSink {
  return {
    write: (record) => {
      const output = [record.message, record.context, record.error]
        .filter((value) => value !== undefined)
        .map((value) => sanitizeObservabilityValue(value));
      consoleLike[record.level](record.timestamp, ...output);
    },
  };
}
