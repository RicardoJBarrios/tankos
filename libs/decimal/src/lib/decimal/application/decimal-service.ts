import { inject, Injectable } from '@angular/core';
import { DECIMAL_ARITHMETIC } from './decimal-tokens';
import type { DecimalInput } from '../core';
import { createDecimalContext } from '../core';
import type { Decimal } from '../core';
import { createDecimal } from './decimal-value';

/** Angular facade for the configured decimal arithmetic port. */
@Injectable()
export class DecimalService {
  readonly #arithmetic = inject(DECIMAL_ARITHMETIC);

  /** Creates an immutable, validated context for division and rounding. */
  public readonly context = createDecimalContext;

  /** Creates an immutable Decimal value for fluent arithmetic. */
  public decimal(value: DecimalInput): Decimal {
    return createDecimal(value, this.#arithmetic);
  }
}
