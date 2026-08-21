/** Base error for provider-independent data-access failures. */
export class DataAccessError extends Error {
  /** Stable machine-readable error code. */
  readonly code: string;

  /** Creates a structured data-access error. */
  constructor(code: string, message: string) {
    super(message);
    this.name = 'DataAccessError';
    this.code = code;
  }
}
