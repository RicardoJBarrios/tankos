import { InjectionToken } from '@angular/core';
import type { DecimalArithmeticPort } from '../core';

/** Injection token for the active Decimal arithmetic port. */
export const DECIMAL_ARITHMETIC = new InjectionToken<DecimalArithmeticPort>(
  'TANK_OS_DECIMAL_ARITHMETIC',
);
