import { DecimalContextError } from '../errors';
import { RoundingMode, ROUNDING_MODES } from './rounding-mode';

/** Configuration required by operations that may round their result. */
export interface DecimalContext {
  /** Maximum number of digits after the decimal separator. */
  readonly decimalPlaces: number;
  /** Rounding behavior used at the configured decimal precision. */
  readonly rounding: RoundingMode;
  readonly __decimalContext: unique symbol;
}

/** Creates a validated decimal operation context. */
export function createDecimalContext(
  decimalPlaces: number,
  rounding: RoundingMode,
): DecimalContext {
  if (!Number.isSafeInteger(decimalPlaces) || decimalPlaces < 0) {
    throw new DecimalContextError(
      'decimalPlaces must be a non-negative safe integer',
    );
  }

  if (!ROUNDING_MODES.includes(rounding)) {
    throw new DecimalContextError(`Unsupported rounding mode: ${rounding}`);
  }

  return Object.freeze({ decimalPlaces, rounding }) as DecimalContext;
}
