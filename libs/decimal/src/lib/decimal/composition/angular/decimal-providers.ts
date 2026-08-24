import type { Provider } from '@angular/core';
import type { DecimalArithmeticPort } from '../../core';
import { DECIMAL_ARITHMETIC, DecimalService } from '../../application';

/** Registers the selected Decimal arithmetic implementation. */
export function provideDecimalArithmetic(
  arithmetic: DecimalArithmeticPort,
): Provider {
  return { provide: DECIMAL_ARITHMETIC, useValue: arithmetic };
}

/** Registers TankOS Decimal providers for the selected arithmetic implementation. */
export function provideTankOsDecimal(
  arithmetic: DecimalArithmeticPort,
): Provider[] {
  return [
    provideDecimalArithmetic(arithmetic),
    { provide: DecimalService, useClass: DecimalService },
  ];
}
