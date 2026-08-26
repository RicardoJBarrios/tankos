export type ErrorCode =
  | 'validation'
  | 'conflict'
  | 'not-found'
  | 'permission-denied'
  | 'unauthorized'
  | 'network'
  | 'persistence'
  | 'unknown';

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface AppError {
  readonly code: ErrorCode;
  readonly severity: ErrorSeverity;
  readonly retryable: boolean;
  readonly context?: Readonly<Record<string, unknown>>;
  readonly cause?: unknown;
}

export interface ErrorReporter {
  report(error: AppError): void;
}

export type ErrorMessageResolver = (error: AppError) => string;

/** Explicit adapter from a library-owned error type to the application contract. */
export interface ErrorNormalizer {
  readonly supports: (error: unknown) => boolean;
  readonly normalize: (error: unknown) => AppError;
}

export function createAppError(
  code: ErrorCode,
  options: Omit<AppError, 'code'>,
): AppError {
  return { code, ...options };
}

export function isAppError(value: unknown): value is AppError {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Partial<AppError>;
  return (
    isErrorCode(candidate.code) &&
    isErrorSeverity(candidate.severity) &&
    typeof candidate.retryable === 'boolean'
  );
}

export function normalizeUnknownError(
  error: unknown,
  normalizers: readonly ErrorNormalizer[] = [],
): AppError {
  if (isAppError(error)) return error;

  const normalizer = normalizers.find(({ supports }) => supports(error));
  if (normalizer) return normalizer.normalize(error);

  return createAppError('unknown', {
    severity: 'critical',
    retryable: false,
    cause: error,
  });
}

function isErrorCode(value: unknown): value is ErrorCode {
  return (
    value === 'validation' ||
    value === 'conflict' ||
    value === 'not-found' ||
    value === 'permission-denied' ||
    value === 'unauthorized' ||
    value === 'network' ||
    value === 'persistence' ||
    value === 'unknown'
  );
}

function isErrorSeverity(value: unknown): value is ErrorSeverity {
  return (
    value === 'info' ||
    value === 'warning' ||
    value === 'error' ||
    value === 'critical'
  );
}
