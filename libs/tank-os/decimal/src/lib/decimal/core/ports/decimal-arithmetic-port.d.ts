import type { DecimalContext } from '../value-types';
import type { DecimalValue } from '../value-types';

/** Two or more operands for a binary arithmetic operator applied repeatedly. */
export type DecimalOperands = readonly [
  DecimalValue,
  DecimalValue,
  ...DecimalValue[],
];

/** Port implemented by a decimal arithmetic engine. */
export interface DecimalArithmeticPort {
  /** Adds all operands from left to right without implicit display rounding. */
  add(...operands: DecimalOperands): DecimalValue;
  /** Subtracts each following operand from the accumulated left-hand result. */
  subtract(...operands: DecimalOperands): DecimalValue;
  /** Multiplies all operands from left to right. */
  multiply(...operands: DecimalOperands): DecimalValue;
  /** Divides sequentially using the explicitly supplied rounding context. */
  divide(
    left: DecimalValue,
    right: DecimalValue,
    context: DecimalContext,
    ...additionalDivisors: DecimalValue[]
  ): DecimalValue;
  /** Returns the JavaScript `%` equivalent for two decimal values. */
  remainder(left: DecimalValue, right: DecimalValue): DecimalValue;
  /** Returns the JavaScript `**` equivalent for an integer decimal exponent. */
  power(
    base: DecimalValue,
    exponent: DecimalValue,
    context?: DecimalContext,
  ): DecimalValue;
  /** Returns the additive inverse of a decimal value. */
  negate(value: DecimalValue): DecimalValue;
  /** Compares two values as less than, equal to or greater than. */
  compare(left: DecimalValue, right: DecimalValue): -1 | 0 | 1;
}
