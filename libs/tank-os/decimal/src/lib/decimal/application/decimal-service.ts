import { inject, Injectable } from '@angular/core';
import { DECIMAL_ARITHMETIC } from './decimal-tokens';
import type { DecimalContext, DecimalInput, DecimalValue } from '../core';
import { createDecimalContext, normalizeDecimalInput } from '../core';
import type { RoundingMode } from '../core';

/** Angular facade for the configured decimal arithmetic port. */
@Injectable()
export class DecimalService {
  readonly #arithmetic = inject(DECIMAL_ARITHMETIC);

  /** Normalizes a supported input into a canonical DecimalValue. */
  normalize(value: DecimalInput): DecimalValue {
    return normalizeDecimalInput(value);
  }

  /** Adds two decimal inputs. */
  add(left: DecimalInput, right: DecimalInput): DecimalValue {
    return this.#arithmetic.add(
      normalizeDecimalInput(left),
      normalizeDecimalInput(right),
    );
  }

  /** Subtracts the right decimal input from the left input. */
  subtract(left: DecimalInput, right: DecimalInput): DecimalValue {
    return this.#arithmetic.subtract(
      normalizeDecimalInput(left),
      normalizeDecimalInput(right),
    );
  }

  /** Multiplies two decimal inputs. */
  multiply(left: DecimalInput, right: DecimalInput): DecimalValue {
    return this.#arithmetic.multiply(
      normalizeDecimalInput(left),
      normalizeDecimalInput(right),
    );
  }

  /** Divides two decimal inputs with an explicit rounding context. */
  divide(
    left: DecimalInput,
    right: DecimalInput,
    context: DecimalContext,
  ): DecimalValue {
    return this.#arithmetic.divide(
      normalizeDecimalInput(left),
      normalizeDecimalInput(right),
      context,
    );
  }

  /** Creates a validated division context for callers. */
  context(decimalPlaces: number, rounding: RoundingMode): DecimalContext {
    return createDecimalContext(decimalPlaces, rounding);
  }

  /** Compares two decimal inputs. */
  compare(left: DecimalInput, right: DecimalInput): -1 | 0 | 1 {
    return this.#arithmetic.compare(
      normalizeDecimalInput(left),
      normalizeDecimalInput(right),
    );
  }
}
