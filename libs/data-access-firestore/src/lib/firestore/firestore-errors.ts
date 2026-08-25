import { DataAccessError, type DataAccessErrorCode } from '@tankos/data-access';

/** Converts provider failures to stable data-access categories. */
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
