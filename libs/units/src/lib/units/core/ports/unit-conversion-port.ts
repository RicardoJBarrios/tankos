import type { ConversionRequest, ConversionResult } from '../value-types';

/** Port for executing declared, deterministic unit conversions. */
export interface UnitConversionPort {
  /** Converts a value and returns its target unit and applied definition. */
  convert(request: ConversionRequest): ConversionResult;
}
