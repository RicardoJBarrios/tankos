import type { DecimalArithmeticPort } from '../core';
import {
  normalizeDecimalInput,
  type Decimal,
  type DecimalContext,
  type DecimalInput,
  type DecimalOperand,
  type DecimalValue,
} from '../core';

function toDecimalValue(operand: DecimalOperand): DecimalValue {
  if (typeof operand === 'object') {
    return operand.value;
  }

  return normalizeDecimalInput(operand);
}

function toDecimalValues(operands: readonly DecimalOperand[]): DecimalValue[] {
  return operands.map(toDecimalValue);
}

/** Internal runtime implementation of the public fluent Decimal contract. */
class DecimalValueObject implements Decimal {
  readonly #arithmetic: DecimalArithmeticPort;
  readonly #value: DecimalValue;

  public constructor(value: DecimalInput, arithmetic: DecimalArithmeticPort) {
    this.#value = normalizeDecimalInput(value);
    this.#arithmetic = arithmetic;
  }

  public get value(): DecimalValue {
    return this.#value;
  }

  public add(...operands: [DecimalOperand, ...DecimalOperand[]]): Decimal {
    return this.#create(this.#arithmetic.add(...this.#operands(operands)));
  }

  public subtract(...operands: [DecimalOperand, ...DecimalOperand[]]): Decimal {
    return this.#create(this.#arithmetic.subtract(...this.#operands(operands)));
  }

  public multiply(...operands: [DecimalOperand, ...DecimalOperand[]]): Decimal {
    return this.#create(this.#arithmetic.multiply(...this.#operands(operands)));
  }

  public divide(
    right: DecimalOperand,
    context: DecimalContext,
    ...additionalDivisors: DecimalOperand[]
  ): Decimal {
    return this.#create(
      this.#arithmetic.divide(
        this.#value,
        toDecimalValue(right),
        context,
        ...toDecimalValues(additionalDivisors),
      ),
    );
  }

  public remainder(right: DecimalOperand): Decimal {
    return this.#create(
      this.#arithmetic.remainder(this.#value, toDecimalValue(right)),
    );
  }

  public power(exponent: DecimalOperand, context?: DecimalContext): Decimal {
    return this.#create(
      this.#arithmetic.power(this.#value, toDecimalValue(exponent), context),
    );
  }

  public negate(): Decimal {
    return this.#create(this.#arithmetic.negate(this.#value));
  }

  public compare(other: DecimalOperand): -1 | 0 | 1 {
    return this.#arithmetic.compare(this.#value, toDecimalValue(other));
  }

  public toString(): string {
    return this.#value;
  }

  public toJSON(): string {
    return this.#value;
  }

  public [Symbol.toPrimitive](hint: string): string {
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

  #operands(
    operands: readonly [DecimalOperand, ...DecimalOperand[]],
  ): [DecimalValue, DecimalValue, ...DecimalValue[]] {
    return [this.#value, ...toDecimalValues(operands)] as [
      DecimalValue,
      DecimalValue,
      ...DecimalValue[],
    ];
  }
}

/** @internal Creates a fluent Decimal for the application composition. */
export function createDecimal(
  value: DecimalInput,
  arithmetic: DecimalArithmeticPort,
): Decimal {
  return new DecimalValueObject(value, arithmetic);
}
