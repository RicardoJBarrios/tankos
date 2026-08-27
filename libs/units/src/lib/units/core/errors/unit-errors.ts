/** Base error for invalid unit-domain data. */
export class UnitError extends Error {
  /** Stable machine-readable error code. */
  public readonly code: string;

  /** Creates a unit-domain error. */
  public constructor(code: string, message: string) {
    super(message);
    this.name = 'UnitError';
    this.code = code;
  }
}

/** Indicates that a qualified unit code is invalid. */
export class UnitCodeError extends UnitError {
  /** Creates an invalid-code error. */
  public constructor(value: unknown) {
    super('UNIT_CODE_INVALID', `Invalid unit code: ${String(value)}`);
    this.name = 'UnitCodeError';
  }
}

/** Indicates that a requested unit conversion cannot be executed. */
export class UnitConversionError extends UnitError {
  /** Creates a structured conversion failure. */
  public constructor(code: string, message: string) {
    super(code, message);
    this.name = 'UnitConversionError';
  }
}
