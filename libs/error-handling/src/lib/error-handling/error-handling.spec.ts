import { ErrorHandler } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it, vi } from 'vitest';
import {
  ERROR_MESSAGE_RESOLVER,
  ERROR_NORMALIZERS,
  ERROR_REPORTER,
  createAppError,
  isAppError,
  normalizeUnknownError,
  provideErrorNormalizer,
  provideGlobalErrorHandling,
} from './error-handling';

describe('error-handling contracts', () => {
  it('preserves typed application errors', () => {
    const error = createAppError('conflict', {
      severity: 'warning',
      retryable: false,
      context: { resource: 'unit-definition' },
    });

    expect(normalizeUnknownError(error)).toBe(error);
    expect(isAppError(error)).toBe(true);
  });

  it('normalizes unknown values without leaking a user-facing message', () => {
    const cause = new Error('Firestore internals');

    expect(normalizeUnknownError(cause)).toMatchObject({
      code: 'unknown',
      severity: 'critical',
      retryable: false,
      cause,
    });
    expect(isAppError(cause)).toBe(false);
  });

  it('uses an explicit library normalizer without inspecting error names', () => {
    const error = {
      kind: 'data-access',
      code: 'forbidden',
      retryable: false,
    };
    const normalizer = {
      supports: (value: unknown) => value === error,
      normalize: (value: unknown) =>
        createAppError('permission-denied', {
          severity: 'error',
          retryable: false,
          cause: value,
        }),
    };

    expect(normalizeUnknownError(error, [normalizer])).toMatchObject({
      code: 'permission-denied',
      severity: 'error',
      retryable: false,
    });
  });

  it('keeps values without a registered normalizer in the unknown category', () => {
    expect(normalizeUnknownError(null).code).toBe('unknown');
    expect(normalizeUnknownError({ code: 'conflict' }).code).toBe('unknown');
  });

  it('rejects malformed application errors', () => {
    expect(isAppError({ code: 'unknown' })).toBe(false);
    expect(
      isAppError({ code: 'not-a-code', severity: 'error', retryable: false }),
    ).toBe(false);
    expect(isAppError(null)).toBe(false);
    expect(isAppError(vi.fn())).toBe(false);
  });

  it('provides safe defaults for reporting and message resolution', () => {
    const error = createAppError('network', {
      severity: 'error',
      retryable: true,
    });

    expect(() => {
      TestBed.inject(ERROR_REPORTER).report(error);
    }).not.toThrow();
    expect(TestBed.inject(ERROR_MESSAGE_RESOLVER)(error)).toBe('network');
  });

  it('reports unexpected errors through the global Angular boundary', () => {
    const report = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideGlobalErrorHandling(),
        { provide: ERROR_REPORTER, useValue: { report } },
      ],
    });

    TestBed.inject(ErrorHandler).handleError(new Error('unexpected'));

    expect(report).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'unknown', severity: 'critical' }),
    );
  });

  it('registers normalizers as multi-providers', () => {
    const normalizer = {
      supports: () => false,
      normalize: () =>
        createAppError('unknown', {
          severity: 'critical',
          retryable: false,
        }),
    };
    TestBed.configureTestingModule({
      providers: [provideErrorNormalizer(normalizer)],
    });

    expect(TestBed.inject(ERROR_NORMALIZERS)).toContain(normalizer);
  });
});
