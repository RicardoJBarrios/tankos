import type { LogSink } from './observability';

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
      const output = [record.message, record.context, record.error].filter(
        (value) => value !== undefined,
      );
      consoleLike[record.level](record.timestamp, ...output);
    },
  };
}
