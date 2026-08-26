import {
  ErrorHandler,
  InjectionToken,
  inject,
  makeEnvironmentProviders,
  type EnvironmentProviders,
  type Provider,
} from '@angular/core';
import {
  type AppError,
  type ErrorMessageResolver,
  type ErrorNormalizer,
  type ErrorReporter,
  normalizeUnknownError,
} from '../core/error-contract';

export const ERROR_REPORTER = new InjectionToken<ErrorReporter>(
  'ERROR_REPORTER',
  { providedIn: 'root', factory: () => ({ report: () => undefined }) },
);

export const ERROR_MESSAGE_RESOLVER = new InjectionToken<ErrorMessageResolver>(
  'ERROR_MESSAGE_RESOLVER',
  { providedIn: 'root', factory: () => (error: AppError) => error.code },
);

export const ERROR_NORMALIZERS = new InjectionToken<readonly ErrorNormalizer[]>(
  'ERROR_NORMALIZERS',
  { providedIn: 'root', factory: () => [] },
);

export function provideErrorNormalizer(normalizer: ErrorNormalizer): Provider {
  return { provide: ERROR_NORMALIZERS, useValue: normalizer, multi: true };
}

class CentralErrorHandler implements ErrorHandler {
  private readonly reporter = inject(ERROR_REPORTER);
  private readonly normalizers = inject(ERROR_NORMALIZERS);

  public handleError(error: unknown): void {
    this.reporter.report(normalizeUnknownError(error, this.normalizers));
  }
}

export function provideGlobalErrorHandling(): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: ErrorHandler, useClass: CentralErrorHandler },
  ]);
}
