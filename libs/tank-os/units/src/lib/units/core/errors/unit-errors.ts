/** Base error for invalid unit-domain data. */
export class UnitError extends Error {
  /** Stable machine-readable error code. */
  readonly code: string;

  /** Creates a unit-domain error. */
  constructor(code: string, message: string) {
    super(message);
    this.name = 'UnitError';
    this.code = code;
  }
}

/** Indicates that a qualified unit code is invalid. */
export class UnitCodeError extends UnitError {
  /** Creates an invalid-code error. */
  constructor(value: unknown) {
    super('UNIT_CODE_INVALID', `Invalid unit code: ${String(value)}`);
    this.name = 'UnitCodeError';
  }
}

/** Indicates that a dimensional exponent is invalid. */
export class DimensionSignatureError extends UnitError {
  /** Creates an invalid-dimension error. */
  constructor(dimension: string, value: unknown) {
    super(
      'DIMENSION_SIGNATURE_INVALID',
      `Invalid exponent for ${dimension}: ${String(value)}`,
    );
    this.name = 'DimensionSignatureError';
  }
}
