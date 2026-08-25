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
    error.message = `${error.message}: ${getCauseMessage(cause)}`;
  }
  return error;
}

function getCauseMessage(cause: unknown): string {
  if (cause instanceof Error) return cause.message;
  if (typeof cause === 'string') return cause;
  const serializedCause = JSON.stringify(cause);
  return typeof serializedCause === 'string'
    ? serializedCause
    : '<unserializable cause>';
}
