import {
  DataAccessError,
  type DataAccessErrorCode,
} from '@tank-os/data-access';

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
    error.message = `${error.message}: ${cause instanceof Error ? cause.message : String(cause)}`;
  }
  return error;
}
