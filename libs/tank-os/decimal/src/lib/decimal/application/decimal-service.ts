import { inject, Injectable } from '@angular/core';
import { DECIMAL_ARITHMETIC } from './decimal-tokens';
import type { DecimalContext, DecimalInput } from '../core';
import { createDecimalContext } from '../core';
import type { RoundingMode } from '../core';
import type { Decimal } from '../core';
import { createDecimal } from './decimal-value';

/** Angular facade for the configured decimal arithmetic port. */
@Injectable()
export class DecimalService {
  readonly #arithmetic = inject(DECIMAL_ARITHMETIC);

  /** Creates an immutable Decimal value for fluent arithmetic. */
  decimal(value: DecimalInput): Decimal {
    return createDecimal(value, this.#arithmetic);
  }

  /** Creates a validated division context for callers. */
  context(decimalPlaces: number, rounding: RoundingMode): DecimalContext {
    return createDecimalContext(decimalPlaces, rounding);
  }
}
