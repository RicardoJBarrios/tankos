import type { DecimalInput, DecimalValue } from './decimal-value';
import type { DecimalContext } from './decimal-context';

/** Values accepted as operands by the fluent Decimal API. */
export type DecimalOperand = Decimal | DecimalInput;

/** Immutable decimal value contract with fluent arithmetic operations. */
export interface Decimal {
  /** Returns the canonical serialized decimal value. */
  readonly value: DecimalValue;
  /** Adds one or more operands and returns a new Decimal. */
  add(...operands: [DecimalOperand, ...DecimalOperand[]]): Decimal;
  /** Subtracts one or more operands from this value in sequence. */
  subtract(...operands: [DecimalOperand, ...DecimalOperand[]]): Decimal;
  /** Multiplies this value by one or more operands in sequence. */
  multiply(...operands: [DecimalOperand, ...DecimalOperand[]]): Decimal;
  /** Divides this value by one or more operands using an explicit context. */
  divide(
    right: DecimalOperand,
    context: DecimalContext,
    ...additionalDivisors: DecimalOperand[]
  ): Decimal;
  /** Returns the remainder after dividing this value by an operand. */
  remainder(right: DecimalOperand): Decimal;
  /** Raises this value to an integer exponent. */
  power(exponent: DecimalOperand, context?: DecimalContext): Decimal;
  /** Returns the additive inverse of this value. */
  negate(): Decimal;
  /** Compares this value with another decimal operand. */
  compare(other: DecimalOperand): -1 | 0 | 1;
  /** Returns the canonical value for string interpolation and logs. */
  toString(): string;
  /** Returns the canonical serialized value for JSON boundaries. */
  toJSON(): string;
  /** Prevents implicit JavaScript numeric or concatenation coercion. */
  [Symbol.toPrimitive](hint: string): string;
}
