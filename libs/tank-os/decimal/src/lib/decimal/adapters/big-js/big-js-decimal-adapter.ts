import Big from 'big.js';
import type {
  DecimalArithmeticPort,
  DecimalContext,
  DecimalValue,
} from '../../core';
import {
  DecimalAdapterError,
  DecimalError,
  DecimalDivisionByZeroError,
  DecimalRangeError,
  InvalidDecimalError,
  createDecimalContext,
  normalizeDecimalInput,
} from '../../core';

/** Creates the default decimal adapter backed by `big.js`. */
export function createBigJsDecimalAdapter(): DecimalArithmeticPort {
  return {
    add: (left, right) =>
      executeDecimal('add', () =>
        Big(toBigValue(left)).plus(toBigValue(right)),
      ),
    subtract: (left, right) =>
      executeDecimal('subtract', () =>
        Big(toBigValue(left)).minus(toBigValue(right)),
      ),
    multiply: (left, right) =>
      executeDecimal('multiply', () =>
        Big(toBigValue(left)).times(toBigValue(right)),
      ),
    divide: (left, right, context) => divide(left, right, context),
    compare: (left, right) =>
      executeCompare('compare', () =>
        Big(toBigValue(left)).cmp(toBigValue(right)),
      ),
  };
}

function divide(
  left: DecimalValue,
  right: DecimalValue,
  context: DecimalContext,
): DecimalValue {
  return executeDecimal('divide', () => {
    const normalizedLeft = toBigValue(left);
    const normalizedRight = toBigValue(right);
    const validatedContext = createDecimalContext(
      context.decimalPlaces,
      context.rounding,
    );

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
  });
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
