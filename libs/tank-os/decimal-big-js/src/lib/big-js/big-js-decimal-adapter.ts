import Big from 'big.js';
import type {
  DecimalArithmeticPort,
  DecimalContext,
  DecimalOperands,
  DecimalValue,
} from '@tank-os/decimal';
import {
  DecimalAdapterError,
  DecimalError,
  DecimalDivisionByZeroError,
  DecimalRangeError,
  InvalidDecimalError,
  createDecimalContext,
  normalizeDecimalInput,
} from '@tank-os/decimal';

/** Creates the default decimal adapter backed by `big.js`. */
export function createBigJsDecimalAdapter(): DecimalArithmeticPort {
  return {
    add: (...operands: DecimalOperands) =>
      reduceDecimal('add', operands, (left, right) => left.plus(right)),
    subtract: (...operands: DecimalOperands) =>
      reduceDecimal('subtract', operands, (left, right) => left.minus(right)),
    multiply: (...operands: DecimalOperands) =>
      reduceDecimal('multiply', operands, (left, right) => left.times(right)),
    divide: (
      left: DecimalValue,
      right: DecimalValue,
      context: DecimalContext,
      ...additionalDivisors: DecimalValue[]
    ) => divide(left, [right, ...additionalDivisors], context),
    remainder: (left: DecimalValue, right: DecimalValue) =>
      executeDecimal('remainder', () => {
        const normalizedRight = toBigValue(right);
        if (normalizedRight === '0') {
          throw new DecimalDivisionByZeroError();
        }

        return Big(toBigValue(left)).mod(normalizedRight);
      }),
    power: (
      base: DecimalValue,
      exponent: DecimalValue,
      context?: DecimalContext,
    ) => power(base, exponent, context),
    negate: (value: DecimalValue) =>
      executeDecimal('negate', () => Big(toBigValue(value)).times(-1)),
    compare: (left: DecimalValue, right: DecimalValue) =>
      executeCompare('compare', () =>
        Big(toBigValue(left)).cmp(toBigValue(right)),
      ),
  };
}

function power(
  base: DecimalValue,
  exponent: DecimalValue,
  context?: DecimalContext,
): DecimalValue {
  return executeDecimal('power', () => {
    const normalizedExponent = toBigValue(exponent);
    const numericExponent = Number(normalizedExponent);

    if (!Number.isSafeInteger(numericExponent)) {
      throw new DecimalAdapterError('power');
    }

    if (numericExponent >= 0) {
      return Big(toBigValue(base)).pow(numericExponent);
    }

    if (!context) {
      throw new DecimalAdapterError('power');
    }

    const normalizedBase = toBigValue(base);
    if (normalizedBase === '0') {
      throw new DecimalDivisionByZeroError();
    }

    const validatedContext = createDecimalContext(
      context.decimalPlaces,
      context.rounding,
    );
    const configuredBig = Big();
    configuredBig.DP = validatedContext.decimalPlaces;
    configuredBig.RM = toBigRoundingMode(
      validatedContext.rounding,
      powerSign(normalizedBase, numericExponent),
      normalizeDecimalInput('1'),
    );

    return configuredBig(normalizedBase).pow(numericExponent);
  });
}

function powerSign(base: DecimalValue, exponent: number): DecimalValue {
  return base.startsWith('-') && Math.abs(exponent) % 2 === 1
    ? normalizeDecimalInput('-1')
    : normalizeDecimalInput('1');
}

function divide(
  left: DecimalValue,
  divisors: DecimalValue[],
  context: DecimalContext,
): DecimalValue {
  return executeDecimal('divide', () => {
    const validatedContext = createDecimalContext(
      context.decimalPlaces,
      context.rounding,
    );

    return divisors.reduce(
      (current, divisor) => {
        const normalizedLeft = normalizeDecimalInput(current.toString());
        const normalizedRight = toBigValue(divisor);

        if (normalizedRight === '0') {
          throw new DecimalDivisionByZeroError();
        }

        const configuredBig = Big();
        configuredBig.DP = validatedContext.decimalPlaces;
        configuredBig.RM = toBigRoundingMode(
          validatedContext.rounding,
          normalizedLeft,
          normalizedRight,
        );

        return configuredBig(normalizedLeft).div(normalizedRight);
      },
      Big(toBigValue(left)),
    );
  });
}

function reduceDecimal(
  operation: string,
  operands: readonly [DecimalValue, DecimalValue, ...DecimalValue[]],
  operationFn: (left: Big, right: Big) => Big,
): DecimalValue {
  return executeDecimal(operation, () =>
    operands
      .slice(1)
      .reduce(
        (current, operand) => operationFn(current, Big(toBigValue(operand))),
        Big(toBigValue(operands[0])),
      ),
  );
}

function executeDecimal(operation: string, callback: () => Big): DecimalValue {
  try {
    return normalizeAdapterResult(operation, callback().toString());
  } catch (error) {
    if (error instanceof DecimalError) {
      throw error;
    }

    throw new DecimalAdapterError(operation);
  }
}

function executeCompare(operation: string, callback: () => number): -1 | 0 | 1 {
  try {
    return callback() as -1 | 0 | 1;
  } catch (error) {
    if (error instanceof DecimalError) {
      throw error;
    }

    throw new DecimalAdapterError(operation);
  }
}

function normalizeAdapterResult(
  operation: string,
  value: string,
): DecimalValue {
  try {
    return normalizeDecimalInput(value);
  } catch (error) {
    if (error instanceof InvalidDecimalError) {
      throw new DecimalRangeError(operation);
    }

    throw error;
  }
}

function toBigValue(value: DecimalValue): DecimalValue {
  return normalizeDecimalInput(value);
}

function toBigRoundingMode(
  rounding: DecimalContext['rounding'],
  left: DecimalValue,
  right: DecimalValue,
): Big.RoundingMode {
  switch (rounding) {
    case 'down':
      return 0;
    case 'half-up':
      return 1;
    case 'half-even':
      return 2;
    case 'up':
      return 3;
    case 'ceil':
      return isNegative(left, right) ? 0 : 3;
    case 'floor':
      return isNegative(left, right) ? 3 : 0;
  }
}

function isNegative(left: DecimalValue, right: DecimalValue): boolean {
  return (
    (left.startsWith('-') && !right.startsWith('-')) ||
    (!left.startsWith('-') && right.startsWith('-'))
  );
}
