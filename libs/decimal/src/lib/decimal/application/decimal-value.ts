import type { DecimalArithmeticPort } from '../core';
import {
  normalizeDecimalInput,
  type Decimal,
  type DecimalContext,
  type DecimalInput,
  type DecimalOperand,
  type DecimalValue,
} from '../core';

/** Internal runtime implementation of the public fluent Decimal contract. */
class DecimalValueObject implements Decimal {
  readonly #arithmetic: DecimalArithmeticPort;
  readonly #value: DecimalValue;

  constructor(value: DecimalInput, arithmetic: DecimalArithmeticPort) {
    this.#value = normalizeDecimalInput(value);
    this.#arithmetic = arithmetic;
  }

  get value(): DecimalValue {
    return this.#value;
  }

  add(...operands: [DecimalOperand, ...DecimalOperand[]]): Decimal {
    return this.#create(this.#arithmetic.add(...this.#operands(operands)));
  }

  subtract(...operands: [DecimalOperand, ...DecimalOperand[]]): Decimal {
    return this.#create(this.#arithmetic.subtract(...this.#operands(operands)));
  }

  multiply(...operands: [DecimalOperand, ...DecimalOperand[]]): Decimal {
    return this.#create(this.#arithmetic.multiply(...this.#operands(operands)));
  }

  divide(
    right: DecimalOperand,
    context: DecimalContext,
    ...additionalDivisors: DecimalOperand[]
  ): Decimal {
    return this.#create(
      this.#arithmetic.divide(
        this.#value,
        this.#valueOf(right),
        context,
        ...this.#values(additionalDivisors),
      ),
    );
  }

  remainder(right: DecimalOperand): Decimal {
    return this.#create(
      this.#arithmetic.remainder(this.#value, this.#valueOf(right)),
    );
  }

  power(exponent: DecimalOperand, context?: DecimalContext): Decimal {
    return this.#create(
      this.#arithmetic.power(this.#value, this.#valueOf(exponent), context),
    );
  }

  negate(): Decimal {
    return this.#create(this.#arithmetic.negate(this.#value));
  }

  compare(other: DecimalOperand): -1 | 0 | 1 {
    return this.#arithmetic.compare(this.#value, this.#valueOf(other));
  }

  toString(): string {
    return this.#value;
  }

  toJSON(): string {
    return this.#value;
  }

  [Symbol.toPrimitive](hint: string): string {
    if (hint === 'string') {
      return this.#value;
    }

    throw new TypeError(
      'Decimal values must use fluent arithmetic methods explicitly',
    );
  }

  #create(value: DecimalValue): Decimal {
    return createDecimal(value, this.#arithmetic);
  }

  #values(operands: readonly DecimalOperand[]): DecimalValue[] {
    return operands.map((operand) => this.#valueOf(operand));
  }

  #operands(
    operands: readonly [DecimalOperand, ...DecimalOperand[]],
  ): [DecimalValue, DecimalValue, ...DecimalValue[]] {
    return [this.#value, ...this.#values(operands)] as [
      DecimalValue,
      DecimalValue,
      ...DecimalValue[],
    ];
  }

  #valueOf(operand: DecimalOperand): DecimalValue {
    if (typeof operand === 'object' && operand !== null) {
      return operand.value;
    }

    return normalizeDecimalInput(operand);
  }
}

/** @internal Creates a fluent Decimal for the application composition. */
export function createDecimal(
  value: DecimalInput,
  arithmetic: DecimalArithmeticPort,
): Decimal {
  return new DecimalValueObject(value, arithmetic);
}
