import { Provider } from '@angular/core';
import { createBigJsDecimalAdapter } from '../../adapters';
import type { DecimalArithmeticPort } from '../../core';
import { DECIMAL_ARITHMETIC, DecimalService } from '../../application';

/** Registers the selected Decimal arithmetic implementation. */
export function provideDecimalArithmetic(
  arithmetic: DecimalArithmeticPort = createBigJsDecimalAdapter(),
): Provider {
  return { provide: DECIMAL_ARITHMETIC, useValue: arithmetic };
}

/** Registers the default TankOS Decimal providers. */
export function provideTankOsDecimal(
  arithmetic?: DecimalArithmeticPort,
): Provider[] {
  return [
    provideDecimalArithmetic(arithmetic),
    { provide: DecimalService, useClass: DecimalService },
  ];
}
