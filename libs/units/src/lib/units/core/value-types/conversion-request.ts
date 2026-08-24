import type { DecimalInput, DecimalValue } from '@tankos/decimal';
import type { UnitCode } from './unit-code';

/** Request to execute one declared conversion between two unit codes. */
export interface ConversionRequest {
  readonly value: DecimalInput;
  readonly sourceUnit: UnitCode;
  readonly targetUnit: UnitCode;
}

/** Structured conversion result retaining the applied function identity. */
export interface ConversionResult {
  readonly value: DecimalValue;
  readonly sourceUnit: UnitCode;
  readonly targetUnit: UnitCode;
  readonly conversionCode: string;
  readonly conversionVersion: string;
}
