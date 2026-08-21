import type { DecimalContext } from '../value-types';
import type { DecimalValue } from '../value-types';

/** Port implemented by a decimal arithmetic engine. */
export interface DecimalArithmeticPort {
  /** Adds two canonical decimal values without implicit display rounding. */
  add(left: DecimalValue, right: DecimalValue): DecimalValue;
  /** Subtracts the right value from the left value. */
  subtract(left: DecimalValue, right: DecimalValue): DecimalValue;
  /** Multiplies two canonical decimal values. */
  multiply(left: DecimalValue, right: DecimalValue): DecimalValue;
  /** Divides two values using the explicitly supplied rounding context. */
  divide(
    left: DecimalValue,
    right: DecimalValue,
    context: DecimalContext,
  ): DecimalValue;
  /** Compares two values as less than, equal to or greater than. */
  compare(left: DecimalValue, right: DecimalValue): -1 | 0 | 1;
}
