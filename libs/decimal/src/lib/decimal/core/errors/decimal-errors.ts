/** Base error for the Decimal public boundary. */
export class DecimalError extends Error {
  /** Stable error code for boundary mapping. */
  public readonly code: string;

  /** Creates a typed decimal error. */
  public constructor(code: string, message: string) {
    super(message);
    this.name = 'DecimalError';
    this.code = code;
  }
}

/** Indicates that an input is not a supported finite decimal. */
export class InvalidDecimalError extends DecimalError {
  /** Creates an invalid-input error. */
  public constructor(value: unknown) {
    super('INVALID_DECIMAL', `Invalid decimal input: ${String(value)}`);
    this.name = 'InvalidDecimalError';
  }
}

/** Indicates that a decimal operation context is invalid. */
export class DecimalContextError extends DecimalError {
  /** Creates a context-validation error. */
  public constructor(message: string) {
    super('INVALID_DECIMAL_CONTEXT', message);
    this.name = 'DecimalContextError';
  }
}

/** Indicates that an operation attempted to divide by zero. */
export class DecimalDivisionByZeroError extends DecimalError {
  /** Creates a division-by-zero error. */
  public constructor() {
    super('DECIMAL_DIVISION_BY_ZERO', 'Cannot divide a decimal by zero');
    this.name = 'DecimalDivisionByZeroError';
  }
}

/** Indicates that an arithmetic result exceeds the Decimal contract limits. */
export class DecimalRangeError extends DecimalError {
  /** Creates a result-range error for the delegated operation. */
  public constructor(operation: string) {
    super(
      'DECIMAL_RANGE_EXCEEDED',
      `Decimal result exceeds the supported range during ${operation}`,
    );
    this.name = 'DecimalRangeError';
  }
}

/** Indicates that a configured arithmetic adapter failed at its boundary. */
export class DecimalAdapterError extends DecimalError {
  /** The operation delegated to the adapter. */
  public readonly operation: string;

  /** Creates an adapter-boundary error without exposing provider semantics. */
  public constructor(operation: string) {
    super(
      'DECIMAL_ADAPTER_FAILURE',
      `Decimal adapter failed during ${operation}`,
    );
    this.name = 'DecimalAdapterError';
    this.operation = operation;
  }
}
