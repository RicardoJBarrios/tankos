/** Stable categories shared by Firestore, HTTP, memory and cache adapters. */
export type DataAccessErrorCode =
  | 'not-found'
  | 'validation'
  | 'forbidden'
  | 'conflict'
  | 'transient'
  | 'permanent'
  | 'lifecycle';

/** Base error for provider-independent data-access failures. */
export class DataAccessError extends Error {
  /** Stable machine-readable error code. */
  readonly code: DataAccessErrorCode;

  /** Whether retrying the same operation may succeed. */
  readonly retryable: boolean;

  /** Creates a structured data-access error. */
  constructor(
    code: DataAccessErrorCode,
    message: string,
    options: { readonly retryable?: boolean } = {},
  ) {
    super(message);
    this.name = 'DataAccessError';
    this.code = code;
    this.retryable = options.retryable ?? false;
  }
}

/** Creates a stable provider-neutral error while retaining a useful cause message. */
export function createDataAccessError(
  code: DataAccessErrorCode,
  message: string,
  cause?: unknown,
): DataAccessError {
  const error = new DataAccessError(code, message, {
    retryable: code === 'transient',
  });
  if (cause !== undefined) {
    const serializedCause = JSON.stringify(cause);
    const causeMessage =
      cause instanceof Error
        ? cause.message
        : typeof cause === 'string'
          ? cause
          : typeof serializedCause === 'string'
            ? serializedCause
            : '<unserializable cause>';
    error.message = `${error.message}: ${causeMessage}`;
  }
  return error;
}
