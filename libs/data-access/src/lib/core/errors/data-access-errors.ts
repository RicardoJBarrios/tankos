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
  public readonly code: DataAccessErrorCode;

  /** Whether retrying the same operation may succeed. */
  public readonly retryable: boolean;

  /** Creates a structured data-access error. */
  public constructor(
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
    error.message = `${error.message}: ${causeMessage(cause)}`;
  }
  return error;
}

function causeMessage(cause: unknown): string {
  if (cause instanceof Error) return cause.message;
  if (typeof cause === 'string') return cause;
  const serializedCause = JSON.stringify(cause);
  return typeof serializedCause === 'string'
    ? serializedCause
    : '<unserializable cause>';
}
