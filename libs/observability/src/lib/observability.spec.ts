import { describe, expect, it, vi } from 'vitest';
import {
  createConsoleLogSink,
  createFirebaseTelemetrySink,
  createNoopLogger,
  createObservability,
  type LogRecord,
} from '../index';

describe('observability', () => {
  it('provides a safe no-op logger for library defaults', () => {
    const logger = createNoopLogger();
    const defaultObservability = createObservability();

    expect(() => {
      logger.debug('debug');
      logger.info('info');
      logger.warn('warn');
      logger.error('error', undefined, new Error('ignored'));
      defaultObservability.logger.info('default');
      defaultObservability.telemetry.trackEvent({ name: 'default' });
      defaultObservability.telemetry.trackException({ error: 'default' });
    }).not.toThrow();
  });

  it('filters logs below the configured level and adds timestamps', () => {
    const write = vi.fn<(record: LogRecord) => void>();
    const observability = createObservability({
      minimumLogLevel: 'warn',
      logSinks: [{ write }],
      now: () => new Date('2026-08-26T12:00:00.000Z'),
    });

    observability.logger.debug('ignored');
    observability.logger.warn('visible', { feature: 'units' });
    observability.logger.error('failed', undefined, new Error('offline'));

    expect(write).toHaveBeenCalledTimes(2);
    expect(write).toHaveBeenNthCalledWith(1, {
      level: 'warn',
      message: 'visible',
      context: { feature: 'units' },
      timestamp: '2026-08-26T12:00:00.000Z',
    });
    expect(write.mock.calls[1][0].error).toEqual(new Error('offline'));
  });

  it('isolates failing sinks and forwards telemetry events', () => {
    const event = vi.fn();
    const exception = vi.fn();
    const observability = createObservability({
      logSinks: [
        {
          write: () => {
            throw new Error('sink failure');
          },
        },
      ],
      telemetrySinks: [{ trackEvent: event, trackException: exception }],
    });

    expect(() => {
      observability.logger.info('safe');
    }).not.toThrow();
    observability.telemetry.trackEvent({
      name: 'unit_saved',
      parameters: { version: 2 },
    });
    observability.telemetry.trackException({ error: 'offline', fatal: true });

    expect(event).toHaveBeenCalledWith({
      name: 'unit_saved',
      parameters: { version: 2 },
    });
    expect(exception).toHaveBeenCalledWith({ error: 'offline', fatal: true });
  });

  it('maps console levels and Firebase events to their provider APIs', () => {
    const consoleLike = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };
    const consoleSink = createConsoleLogSink(consoleLike);
    consoleSink.write({ level: 'error', message: 'broken', timestamp: 'now' });
    const logEvent = vi.fn();
    const analytics = {};
    const firebaseSink = createFirebaseTelemetrySink(analytics, logEvent);

    firebaseSink.trackEvent({ name: 'unit_saved', parameters: { version: 2 } });
    firebaseSink.trackException({ error: new Error('offline') });
    firebaseSink.trackException({ error: 'offline' });
    firebaseSink.trackException({ error: { reason: 'offline' } });
    firebaseSink.trackException({ error: undefined });

    expect(consoleLike.error).toHaveBeenCalledWith('now', 'broken');
    expect(logEvent).toHaveBeenNthCalledWith(1, analytics, 'unit_saved', {
      version: 2,
    });
    expect(logEvent).toHaveBeenNthCalledWith(2, analytics, 'exception', {
      description: 'offline',
      fatal: false,
    });
    expect(logEvent).toHaveBeenNthCalledWith(3, analytics, 'exception', {
      description: 'offline',
      fatal: false,
    });
    expect(logEvent).toHaveBeenNthCalledWith(4, analytics, 'exception', {
      description: '{"reason":"offline"}',
      fatal: false,
    });
    expect(logEvent).toHaveBeenNthCalledWith(5, analytics, 'exception', {
      description: 'Unknown error',
      fatal: false,
    });
  });
});
